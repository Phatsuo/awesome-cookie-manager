var hostPage;
var allCookies;
var cookieCheckBoxPrefix = 'cookieCheckBox-';
var cookieRowPrefix = 'cookieRow-';

var lsSavedCookies = 'savedCookies';
var lsMaxSavedCookies = 'maxSavedCookies';

$(document).ready(function () {
	hostPage = window.location.pathname.replace(/^.*\/([^/]*)/, "$1").replace(/\.html/, '');
	if (hostPage == 'popup') {
		initTimeSelects();
		$('input:button').button();
		setPopupForm();
		$('#filterDomainInput').focus();
		initFilterKeyPress();
		loadCookies();
		$('#newExpirationDatePicker').datepicker();
		bindDomEvents();
	}
});

function initTimeSelects() {
	addRangeToSelect('#newExpirationHours', 24);
	addRangeToSelect('#newExpirationMinutes', 60);
	addRangeToSelect('#newExpirationSeconds', 60);
}

function addRangeToSelect(selector, max) {
	for (var i=0; i < max; i++) {
		var text = i;
		if (i < 10) {
			text = "0" + i;
		}
		$(selector).append("'<option value='" + i + "'>" + text + "</option>");
	}
}

function bindDomEvents() {
	$('#previousThemeAnchor').click(function () {
		nextTheme(-1);
		return false;
	});
	$('#nextThemeAnchor').click(function () {
		nextTheme(1);
		return false;
	});
	$('#loadCookiesAnchor').click(function () {
		loadCookies();
		return false;
	});
	$('#clearFiltersAnchor').click(function () {
		clearFilters();
		return false;
	});
	$('#selectAllButton').click(function () {
		selectAll();
	});
	$('#selectNoneButton').click(function () {
		selectNone();
	});
	$('#saveOrRestoreButton').click(function () {
		saveOrRestore();
	});
	$('#deleteButton').click(function () {
		deleteSelectedCookiesConfirm();
	});		
	$('#saveSelectedCookiesAnchor').click(function () {
		saveSelectedCookies();
		return false;
	});
	$('#editCookieValueAnchor').click(function () {
		editCookieValues();
		return false;
	});
	$('#filterDomainInput').attr('autofocus', 'autofocus');
	$(document).on('click', '.cookieDetailsAnchor', function () {
		var cookieId = $(this).attr('cookieId');
		showCookieDetails(cookieId);
		return false;
	});
	$(document).on('click', '.restoreSavedCookiesAnchor', function () {
		var cookieName = $(this).attr('cookieName');
		restoreSavedCookiesConfirm(cookieName);
		return false;
	});
	$(document).on('click', '.delete_session_anchor', function () {
		var cookieName = $(this).attr('cookieName');
		var cookieTitle = $(this).attr('cookieTitle');
		deleteSavedCookiesConfirm(cookieName, cookieTitle);
		return false;
	});
	
}

function initFilterKeyPress() {

	$('#filterDomainInput').keydown(function(e){
		if (e.which != 13){
			loadCookies();
		}
	});
	$('#filterNameInput').keydown(function(e){
		if (e.which != 13){
			loadCookies();
		}
	});
	$('#filterValueInput').keydown(function(e){
		if (e.which != 13){
			loadCookies();
		}
	});
}

function clearFilters() {
	$('#filterDomainInput,#filterNameInput,#filterValueInput').val('');
	loadCookies();
}

function loadCookies() {	
	chrome.cookies.getAll({}, function(cookies){
		cookies = filterCookies(cookies);
		$('#cookieCountSpan').html(addCommas(cookies.length));
		cookies.sort(sortDomain);
		allCookies = cookies;
		var html = "<table id='tab2'><tr id='row1'><td id='col1b'><b>Domain</b></td><td id='col2b'><b>Name</b></td><td align='right' id='col3b'><b>Expiration</b></td><td></td></tr>";
		if (cookies.length == 0) {
			html += "<tr><td colspan='5'>no cookies returned!</td></tr>";
		} else {
			for (var i = 0, cookie; cookie = cookies[i]; i++) {
				html += "<tr id='" + cookieRowPrefix + i + "'><td><input type='checkbox' id='" + cookieCheckBoxPrefix + i + "' />" + limitStringLength(cookie.domain, 35) + "</td><td><a class='cookieDetailsAnchor' cookieId='" + i + "' href=''>" 
				+ limitStringLength(cookie.name, 30) + "</a></td><td name='date' align='right'>" + formatExpirationDate(cookie.expirationDate) + "</td><td name='time' align='right'>"
				+ formatExpirationTime(cookie.expirationDate) + '</td></tr>';
			}
		}
		html += '</table>';
		$('#listDiv').html(html);
		var w1 = $('#col1b').width();
		var w2 = $('#col2b').width();
		var w3 = $('#col3b').width();
		$('#col1a').attr('width', w1);
		$('#col2a').attr('width', w2);
		$('#col3a').attr('width', w3);
		$('#row1').hide();		
	});
}

function filterCookies(cookies) {
	var newCookies = new Array();
	var filterDomainPattern;
	var filterNamePattern;
	var filterValuePattern;
	filterDomain_set($("#filterDomainInput").val());
	filterName_set($("#filterNameInput").val());
	filterValue_set($("#filterValueInput").val());
	if (filterDomain.length > 0) {
		filterDomainPattern = new RegExp(filterDomain,'i');
	}	
	if (filterName.length > 0) {
		filterNamePattern = new RegExp(filterName,'i');
	}	
	if (filterValue.length > 0) {
		filterValuePattern = new RegExp(filterValue,'i');
	}
	for (var i = 0, cookie; cookie = cookies[i]; i++) {
		if (filterMatch(cookie, filterDomainPattern, filterNamePattern, filterValuePattern)) {
			newCookies.push(cookie);
		}
	}
	return newCookies;
}

function filterMatch(cookie, filterDomainPattern, filterNamePattern, filterValuePattern) {
	if (filterDomainPattern == undefined && filterNamePattern == undefined && filterValuePattern == undefined) {
		return true;
	}
	if (filterDomainPattern != undefined && cookie.domain.search(filterDomainPattern) == -1) {
		return false;
	}
	if (filterNamePattern != undefined && cookie.name.search(filterNamePattern) == -1) {
		return false;
	}
	if (filterValuePattern != undefined && cookie.value.search(filterValuePattern) == -1) {
		return false;
	}
	return true;
}

function limitStringLength(string, max) {
	if (string.length < max) {
		return string;
	}
	return string.substring(0, max) + '...';
}

function formatExpirationDateTime(expirationDate) {
	if (expirationDate == undefined) {
		return 'session';
	}
	var d = new Date(expirationDate*1000);
	var date = d.getDate();
	var month = d.getMonth() + 1;
	var year = d.getFullYear();
	var hours = d.getHours();
	var minutes = d.getMinutes();
	var seconds = d.getSeconds();
	if (minutes < 10) {
		minutes = '0' + minutes;
	}
	if (seconds < 10) {
		seconds = '0' + seconds;
	}
	return month + '/' + date + '/' + year + ' ' + hours + ':' + minutes + ':' + seconds;
}

function formatExpirationDate(expirationDate) {
	if (expirationDate == undefined) {
		return 'session';
	}
	var d = new Date(expirationDate*1000);
	var date = d.getDate();
	var month = d.getMonth() + 1;
	var year = d.getFullYear();
	return month + '/' + date + '/' + year;
}

function formatExpirationTime(expirationDate) {
	if (expirationDate == undefined) {
		return '';
	}
	var d = new Date(expirationDate*1000);
	var hours = d.getHours();
	var minutes = d.getMinutes();
	var seconds = d.getSeconds();
	if (minutes < 10) {
		minutes = '0' + minutes;
	}
	if (seconds < 10) {
		seconds = '0' + seconds;
	}
	return hours + ':' + minutes + ':' + seconds;
}

function sortDomain(a, b) {
	var aStr = rootDomain(a.domain).toLowerCase();
	var bStr = rootDomain(b.domain).toLowerCase();
	if (aStr < bStr) {
		return -1;
	}
	if (aStr > bStr) {
		return 1;
	}
	aStr = a.domain.toLowerCase();
	bStr = b.domain.toLowerCase();
	if (aStr < bStr) {
		return -1;
	}
	if (aStr > bStr) {
		return 1;
	}
	aStr = a.name.toLowerCase();
	bStr = b.name.toLowerCase();
	if (aStr < bStr) {
		return -1;
	}
	if (aStr > bStr) {
		return 1;
	}
	return 0;
}

function rootDomain(domain) {
	var array = domain.split('.');
	if (array.length <= 2) {
		return domain;
	}
	return array[array.length-2] + '.' + array[array.length-1];
}

function sortIntDescending(a, b) {
	var aInt = parseInt(a) * -1;
	var bInt = parseInt(b) * -1;
	if (aInt < bInt) {
		return -1;
	}
	if (aInt > bInt) {
		return 1;
	}
	return 0;
}

function showCookieDetails(index) {
	var index = parseInt(index);
	if (index >= allCookies.length) {
		index = 0;
	} else if (index < 0) {
		index = allCookies.length-1;
	}
	var cookie = allCookies[index];
	$('#currentCookieId').attr('cookieId', index);
	$('#detailsDomainSpan').html(cookie.domain);
	$('#detailsNameSpan').html(cookie.name);
	$('#detailsValueDiv').html(cookie.value);
	$('#detailsHostOnlySpan').html(cookie.hostOnly ? 'true' : 'false');
	$('#detailsPathSpan').html(cookie.path);
	$('#detailsSecureSpan').html(cookie.secure ? 'true' : 'false');
	$('#detailsHttpOnlySpan').html(cookie.httpOnly ? 'true' : 'false');
	$('#detailsSessionSpan').html(cookie.session ? 'true' : 'false');
	$('#detailsExpirationDateSpan').html(formatExpirationDateTime(cookie.expirationDate));
	$('#detailsStoreIdSpan').html(cookie.storeId);
	$('#cookieDetailsDiv').dialog("destroy").dialog({ autoOpen:false, width: 725, modal: true,
		buttons:
		{
			"Previous": function() { showCookieDetails(index-1); },
			"Next": function() { showCookieDetails(index+1); },
			"Edit": function() { editCookieValues(); },
			"Close": function() { $(this).dialog("close"); }
		}
	});
	$('#cookieDetailsDiv').dialog("option", "title", "Cookie Details");
	$('#cookieDetailsDiv').dialog('open');	
}

function editCookieValues() {
	var index = parseInt($('#currentCookieId').attr('cookieId'));
	
	if (index >= allCookies.length) {
		index = 0;
	} else if (index < 0) {
		index = allCookies.length-1;
	}
	
	var cookie = allCookies[index];
	$('#editDomainSpan').html(cookie.domain);
	$('#editNameSpan').html(cookie.name);
	$('#editValueCurrentDiv').html(cookie.value);
	$('#editValueNewTextArea').val(cookie.value);
	var cols = $('#editValueNewTextArea').attr('cols');
	$('#editValueNewTextArea').attr('rows', (cookie.value.length/cols)+ 2);
	$('#editExpirationDateSpan').html(formatExpirationDateTime(cookie.expirationDate));	
	var dt = new Date(formatExpirationDateTime(cookie.expirationDate));
	$('#newExpirationDatePicker').datepicker( "setDate" , dt);
	$('#newExpirationHours').val(dt.getHours());
	$('#newExpirationMinutes').val(dt.getMinutes());
	$('#newExpirationSeconds').val(dt.getSeconds());
	$('#editCookieDiv').dialog("destroy").dialog({ autoOpen:false, width: 725, modal: true,
		buttons:
		{	
			"Save": function() { saveCookieEdits(); },
			"Cancel": function() { $(this).dialog("close"); }
		}
	});
	$('#editCookieDiv').dialog("option", "title", "Edit Cookie Value");
	$('#editCookieDiv').dialog('open');	
}

function saveCookieEdits() {
	var index = parseInt($('#currentCookieId').attr('cookieId'));
	
	var currentValue = $('#editValueCurrentDiv').html();
	var newValue = $.trim($('#editValueNewTextArea').val());
	
	var currentExpirationDate = new Date($('#editExpirationDateSpan').html());
	var newExpirationDate = getNewExpirationDate();
	
	if (currentValue != newValue || currentExpirationDate != newExpirationDate) {
		var cookie = allCookies[index];
		var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path; 
		var expirationDate = newExpirationDate.getTime() / 1000;
		// NOTE: do not specify the domain. "domain:cookie.domain" - domains like "ads.undertone.com" will end up as ".ads.undertone.com"
		chrome.cookies.set({url:url, name:cookie.name, value:newValue, path:cookie.path, secure:cookie.secure, httpOnly:cookie.httpOnly, expirationDate:expirationDate, storeId:cookie.storeId}, function() {
			cookie.value = newValue;
			cookie.expirationDate = expirationDate;
			$('#detailsValueDiv').html(cookie.value);
			$('#detailsExpirationDateSpan').html(formatExpirationDateTime(cookie.expirationDate));
			$("#cookieDetailsDiv").dialog( "option", "maxHeight", 600);
			$('#editCookieDiv').dialog('close');
			if (currentExpirationDate != newExpirationDate) {
				// have to update the list...
				$('#cookieRow-' + index + ' > td[name="date"]').html(formatExpirationDate(cookie.expirationDate));
				$('#cookieRow-' + index + ' > td[name="time"]').html(formatExpirationTime(cookie.expirationDate));
			}
		});
		return;
	}
	$('#editCookieDiv').dialog('close');
}

function selectAll() {
	$('input[id^="' + cookieCheckBoxPrefix + '"]').attr('checked', true);
}

function selectNone() {
	$('input[id^="' + cookieCheckBoxPrefix + '"]').attr('checked', false);
}

function deleteSelectedCookiesConfirm() {
	if (confirmDeleteCookies) {
		var selected = 0;
		for (var i = 0, cookie; cookie = allCookies[i]; i++) {
			if ($('#' + cookieCheckBoxPrefix + i).attr('checked')) {
				selected++;
			}
		}
		showConfirm('Delete Cookies', 'Are you sure you want to delete the selected cookies?<br/><br/>Selected cookies count: ' + selected, deleteSelectedCookies);
	} else {
		deleteSelectedCookies(true);
	}
}

function deleteSelectedCookies(del) {
	if (del) {
		var removedIndexes = new Array();
		for (var i = 0, cookie; cookie = allCookies[i]; i++) {
			if ($('#' + cookieCheckBoxPrefix + i).attr('checked')) {
				removedIndexes.push(i);
				removeCookie(i, cookie);
			}
		}
		removedIndexes.sort(sortIntDescending);
		for (var i = 0; i < removedIndexes.length; i++) {
			var index = removedIndexes[i];
			allCookies.splice(index, 1);
			$('#' + cookieRowPrefix + index).hide();
		}
		$('#cookieCountSpan').html(addCommas(allCookies.length));
	}
}

function removeCookie(index, cookie) {
	var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
	chrome.cookies.remove({url:url, name:cookie.name, storeId:cookie.storeId}, function(){
		
	});
}

function nextTheme(add) {
	var id = parseInt($('#styleSelect option:selected').attr('id')) + add;
	if (id > 23) {id = 0;}
	if (id < 0) {id = 23;}
	uiStyle = $("#styleSelect option[id=" + id + "]").val();
	$('#styleSelect').val(uiStyle);
	$('#styleLink').attr('href', 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.12/themes/' + uiStyle + '/jquery-ui.css');
	localStorage[lsUiStyle] = uiStyle;
}

function saveOrRestore() {
	
	var title = '';
	
	var filterDomain = $("#filterDomainInput").val();
	var filterName = $("#filterNameInput").val();
	var filterValue = $("#filterValueInput").val();
	
	if (filterDomain.length > 0) {
		title += 'Domain: [' + filterDomain + ']';
	}

	if (filterName.length > 0) {
		if (title.length > 0) {
			title += ' ';
		}
		title += 'Name: [' + filterName + ']';
	}

	if (filterValue.length > 0) {
		if (title.length > 0) {
			title += ' ';
		}
		title += 'Value: [' + filterValue + ']';
	}
	
	if (title.length == 0) {
		title = 'All Selected Cookies';
	}
	$('#savedCookiesTitle').val(title);
	$('#savedCookiesTitle').css('width', 370);
	$('#savedCookiesContainerDiv').attr('style', 'height:' + (popupHeight-100) + 'px; overflow:auto;');
	$('#saveCookiesErrorSpan').html('');
	showSavedCookieList();
	$('#saveCookiesDialogDiv').dialog("destroy").dialog({ autoOpen:false, width: 460, modal: true,
		buttons:
		{
			"Close": function() { $(this).dialog("close"); }
		}
	});
	$('#saveCookiesDialogDiv').dialog("option", "title", "Save/Restore Cookies");
	$('#saveCookiesDialogDiv').dialog('open');
}

function maxSavedCookies_get() {
	maxSavedCookies = localStorage[lsMaxSavedCookies];
	if (maxSavedCookies == undefined) {
		maxSavedCookies_set(-1);
	} else {
		maxSavedCookies = parseInt(maxSavedCookies);
	}
}

function maxSavedCookies_set(val) {
	maxSavedCookies = val;
	localStorage[lsMaxSavedCookies] = maxSavedCookies;
}

function nextSavedCookiesName() {
	maxSavedCookies_get();
	var next = 0;
	for (var i = 0; i <= maxSavedCookies; i++) {
		if (localStorage[savedCookiesName(i)] == undefined) {
			return savedCookiesName(i);
		}
	}
	maxSavedCookies_set(maxSavedCookies+1);
	return savedCookiesName(maxSavedCookies);
}

function savedCookiesName(i) {
	return lsSavedCookies + '-' + i;
}

function sortSavedCookies(a, b) {
	var aStr = a.title.toLowerCase();
	var bStr = b.title.toLowerCase();
	if (aStr < bStr) {
		return -1;
	}
	if (aStr > bStr) {
		return 1;
	}
	return 0;
}

function saveSelectedCookies() {
	$('#saveCookiesErrorSpan').html('');
	var title = $('#savedCookiesTitle').val();
	if (title.length == '') {
		$('#saveCookiesErrorSpan').html('Title is required.');
		return;
	}
	var cookies = new Array();
	for (var i = 0, cookie; cookie = allCookies[i]; i++) {
		if ($('#' + cookieCheckBoxPrefix + i).attr('checked')) {
			cookies.push(cookie);
		}
	}
	if (cookies.length == 0) {
		$('#saveCookiesErrorSpan').html('Could not save. No cookies have been selected (checked) for saving.');
		return;
	}
	
	var savedCookies = {title:title, saved:String(new Date()), cookies:cookies};
	var savedCookiesName = nextSavedCookiesName();
	localStorage[savedCookiesName] = JSON.stringify(savedCookies);
	showSavedCookieList();
}

function showSavedCookieList() {
	$('#savedCookiesDiv').html('');
	var html = '<table><tr><td></td><td><b>Title</b></td><td><b>Saved</b></td><td><b>Cookies</b></td><td><b>Delete</b></td></tr>';
	maxSavedCookies_get();
	var savedCookiesArray = new Array();
	for (var i = 0; i <= maxSavedCookies; i++) {
		if (localStorage[savedCookiesName(i)] != undefined) {
			var savedCookies = JSON.parse(localStorage[savedCookiesName(i)]);
			savedCookiesArray.push({name:savedCookiesName(i), title:savedCookies.title, saved:savedCookies.saved, cookieCount:savedCookies.cookies.length});
		}
	}
	savedCookiesArray.sort(sortSavedCookies);
	for (var i = 0, savedCookies; savedCookies = savedCookiesArray[i]; i++) {
		var icon = savedCookies.cookieCount == 1 ? 'application.png' : savedCookies.cookieCount == 2 ? 'application_double.png' : 'application_cascade.png';
		html += "<tr>";
		html += "<td><a class='restoreSavedCookiesAnchor' cookieName='" + savedCookies.name + "' href='' title='Restore Saved Cookies'><img src='" + icon + "' class='move-icon-down'></a></td>";
		html += "<td><a class='restoreSavedCookiesAnchor' cookieName='" + savedCookies.name + "' href='' title='Restore Saved Cookies'>" + savedCookies.title + "</a></td>";
		html += "<td>" + String(savedCookies.saved).replace(/ GMT.+/, '') + "</td>";
		html += "<td align='center'>" + addCommas(savedCookies.cookieCount) + "</td>";
		var cookieTitle = savedCookies.title.replace(/'/g, "\'").replace(/"/g, '');
		html += "<td align='center'><a class='delete_session_anchor' cookieName='" + savedCookies.name + "' cookieTitle='" + cookieTitle + "' title='Delete Saved Cookies'><img class='delete-session-img move-icon-down' src='tab_close_2.png' class='move-icon-down'></a></td>";
		html += "</tr>";
	}
	html += '</table>';
	if (savedCookiesArray.length == 0) {
		html = '<br/><br/>&nbsp;&nbsp;&nbsp;<i>No saved cookies were found.</i>';
	}
	$('#savedCookiesDiv').append(html);
	$(".delete_session_anchor").hover(function(){$(this).children(".delete-session-img").attr('src', 'tab_close_2_hover.png');},function(){$(this).children(".delete-session-img").attr('src', 'tab_close_2.png');});
}

function deleteSavedCookiesConfirm(savedCookiesName, title) {
	if (confirmDeleteStoredCookies) {
		showConfirm('Delete Saved Cookies', 'Are you sure you want to delete these Saved Cookies?<br/><br/>' + title, deleteSavedCookies, savedCookiesName);
	} else {
		deleteSavedCookies(true, savedCookiesName);
	}
}

function deleteSavedCookies(del, savedCookiesName) {
	if (del) {
		localStorage.removeItem(savedCookiesName);
		showSavedCookieList();
	}
}

function addCommas(nStr)
{
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}

function showConfirm(title, msg, func, p1, p2) {
	confirmFunction = func;
	$('#confirmSpan').html('<br/>' + msg);
	$('#confirmDiv').dialog("destroy").dialog({ autoOpen:false, width: 460, modal: true,
		buttons:
		{
			"Yes": function() { confirmFunction(true, p1, p2);$(this).dialog("close"); },
			"No": function() { confirmFunction(false, p1, p2);$(this).dialog("close"); }
		}
	});
	$('#confirmDiv').dialog("option", "title", title);
	$('#confirmDiv').dialog('open');
}

function restoreSavedCookiesConfirm(savedCookiesName) {
	if (confirmRestoreStoredCookies) {
		var savedCookies = JSON.parse(localStorage[savedCookiesName]);
		showConfirm('Restore Saved Cookies', 'Are you sure you want to restore these Saved Cookies?<br/><br/>' + savedCookies.title, restoreSavedCookies, savedCookiesName);
	} else {
		restoreSavedCookies(true, savedCookiesName);
	}
}

function restoreSavedCookies(restore, savedCookiesName) {
	if (restore) {
		var bg = chrome.extension.getBackgroundPage();
		bg.restoreSavedCookiesBackground(savedCookiesName, loadCookies);
	}
}

function restoreSavedCookiesBackground(savedCookiesName, callback) {
	var savedCookies = JSON.parse(localStorage[savedCookiesName]);
	if (savedCookies == undefined || savedCookies.cookies == undefined) {
		$('#saveCookiesErrorSpan').html('Error restoring saved cookies.');
		return;
	}
	for (var i = 0, cookie; cookie = savedCookies.cookies[i]; i++) {
		restoreCookie(cookie);
	}
	if (callback != undefined) {
		callback();
	}
}

function restoreCookie(cookie) {
	var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
	var expirationDate = cookie.expirationDate;
	if (restoreFixExpiration && expirationDate != undefined) {
		var exp = new Date(expirationDate*1000);
		var now = new Date();
		if (exp < now) {
			expirationDate += 31556926;
		}
	}
	
	// NOTE: do not specify the domain. "domain:cookie.domain" - domains like "ads.undertone.com" will end up as ".ads.undertone.com"
	chrome.cookies.set({url:url, name:cookie.name, value:cookie.value, path:cookie.path, secure:cookie.secure, httpOnly:cookie.httpOnly, expirationDate:expirationDate, storeId:cookie.storeId});
}

function getNewExpirationDate() {
	var dt = $('#newExpirationDatePicker').datepicker('getDate');
	dt.setHours($('#newExpirationHours').val());
	dt.setMinutes($('#newExpirationMinutes').val());
	dt.setSeconds($('#newExpirationSeconds').val());
	return dt;
}