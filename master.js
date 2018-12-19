/////////////////
// option vars //
/////////////////
var lsUiStyle = 'uiStyle';

// local storage settings key names
var lsConfirmDeleteCookies = 'confirmDeleteCookies';
var lsConfirmRestoreStoredCookies = 'confirmRestoreStoredCookies';
var lsRestoreFixExpiration = 'restoreFixExpiration';
var lsConfirmDeleteStoredCookies = 'confirmDeleteStoredCookies';
var lsFilterDomain = 'filterDomain';
var lsFilterName = 'filterName';
var lsFilterValue = 'filterValue';
var lsRememberFilterCloseTab = 'rememberFilter';
var lsPopupHeight = 'popupHeight';
var lsPopupWidth = 'popupWidth';


// local storage settings variables
var confirmDeleteCookies;
var confirmRestoreStoredCookies;
var restoreFixExpiration;
var confirmDeleteStoredCookies;
var filterDomain;
var filterName;
var filterValue;
var rememberFilter;
var popupHeight;
var popupWidth;

var uiStyle = localStorage[lsUiStyle] != undefined ? localStorage[lsUiStyle] : 'start';
$('#styleLink').attr('href', 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.12/themes/' + uiStyle + '/jquery-ui.css');

////////////////
// popup vars //
////////////////

var hostPage;
var allCookies;
var cookieCheckBoxPrefix = 'cookieCheckBox-';
var cookieRowPrefix = 'cookieRow-';

var lsSavedCookies = 'savedCookies';
var lsMaxSavedCookies = 'maxSavedCookies';

var maxSavedCookies;

$(document).ready(function () {
	getAllOptionValues();
	hostPage = window.location.pathname.replace(/^.*\/([^\/]*)/, "$1").replace(/\.html/, '');
	if (hostPage == 'popup') {
		initTimeSelects();
		$('input:button').button();
		setPopupForm();
		$('#filterDomainInput').focus();
		initFilterKeyPress();
		loadCookies();
		$('#newExpirationDatePicker').datepicker({
			changeMonth: true,
			changeYear: true,
			showOtherMonths: true,
			selectOtherMonths: true,
			numberOfMonths: 2,
			showButtonPanel: true
		});
		bindDomEvents();
	}
	else if (hostPage == 'options') {
		setOptionsForm();
		$('#saveButton').click(function () {
			saveOptions();
			return false;
		});
		$('#closeButton').click(function () {
			closeWindow();
			return false;
		});
	}	
});

/////////////////////
// popup functions //
/////////////////////

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
	$('#styleSelect').change(function() {
		styleSelectChanged();
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
	$(document).on('click', '#selectAllCookiesAnchor', function () {
		selectAll();
		$('#saveCookiesErrorSpan').html('');
		return false;
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
		var w1 = parseInt($('#col1b').width(), 10);
		var w2 = parseInt($('#col2b').width(), 10);
		var w3 = parseInt($('#col3b').width(), 10);
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
	var aInt = parseInt(a, 10) * -1;
	var bInt = parseInt(b, 10) * -1;
	if (aInt < bInt) {
		return -1;
	}
	if (aInt > bInt) {
		return 1;
	}
	return 0;
}

function showCookieDetails(index) {
	index = parseInt(index, 10);
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
	var index = parseInt($('#currentCookieId').attr('cookieId'), 10);
	
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
	var index = parseInt($('#currentCookieId').attr('cookieId'), 10);
	
	var currentValue = $('#editValueCurrentDiv').html();
	var newValue = String($('#editValueNewTextArea').val());
	newValue = $.trim(newValue);	
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
		showConfirm('Delete Cookies', 'Are you sure you want to delete the selected cookies?<br/><br/>Selected cookies count: ' + selected, deleteSelectedCookies, null, null);
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
	var id = parseInt($('#styleSelect option:selected').attr('id'), 10) + add;
	if (id > 23) {id = 0;}
	if (id < 0) {id = 23;}
	uiStyle = $("#styleSelect option[id=" + id + "]").val();
	$('#styleSelect').val(String(uiStyle));
	$('#styleLink').attr('href', 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.12/themes/' + uiStyle + '/jquery-ui.css');
	localStorage[lsUiStyle] = uiStyle;
}

function styleSelectChanged() {
	uiStyle = $('#styleSelect').val();
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
		maxSavedCookies = parseInt(maxSavedCookies, 10);
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
		$('#saveCookiesErrorSpan').html('Could not save. No cookies have been selected (checked) for saving.&nbsp;&nbsp;&nbsp;<a href="" id="selectAllCookiesAnchor">select all</a>');
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
		showConfirm('Delete Saved Cookies', 'Are you sure you want to delete these Saved Cookies?<br/><br/>' + title, deleteSavedCookies, savedCookiesName, null);
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
	var x = nStr.split('.');
	var x1 = x[0];
	var x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}

function showConfirm(title, msg, func, p1, p2) {
	var confirmFunction = func;
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
		showConfirm('Restore Saved Cookies', 'Are you sure you want to restore these Saved Cookies?<br/><br/>' + savedCookies.title, restoreSavedCookies, savedCookiesName, null);
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
	var dt = new Date($('#newExpirationDatePicker').datepicker('getDate'));
	var hours = parseInt($('#newExpirationHours').val(), 10);
	var minutes = parseInt($('#newExpirationMinutes').val(), 10);
	var seconds = parseInt($('#newExpirationSeconds').val(), 10);
	dt.setHours(hours);
	dt.setMinutes(minutes);
	dt.setSeconds(seconds);
	return dt;
}

//////////////////////
// option functions //
//////////////////////

function getAllOptionValues() {
	confirmDeleteCookies_get();
	confirmRestoreStoredCookies_get();
	restoreFixExpiration_get();
	confirmDeleteStoredCookies_get();
	filterDomain_get();
	filterName_get();
	filterValue_get();
	rememberFilter_get();
	popupHeight_get();
	popupWidth_get();
}

function setPopupForm() {
	$('#styleSelect').val(uiStyle);

	if (rememberFilter && filterDomain != undefined && filterDomain != null && filterDomain != '' && filterDomain.length > 0 && filterDomain != 'undefined') {
		$('#filterDomainInput').val(filterDomain);
	}

	if (rememberFilter && filterName != undefined && filterName != null && filterName != '' && filterName.length > 0 && filterName != 'undefined') {
		$('#filterNameInput').val(filterName);
	}

	if (rememberFilter && filterValue != undefined && filterValue != null && filterValue != '' && filterValue.length > 0 && filterValue != 'undefined') {
		$('#filterValueInput').val(filterValue);
	}

	var cookiesDivHeightCss = 'height:' + popupHeight + 'px; overflow:auto;';
	$('#cookiesDiv').attr('style', cookiesDivHeightCss);

	var dialogueContainerHeightCss = 'height:' + (popupHeight-100) + 'px; overflow:auto;';
	$('#detailsDialogueContainer').attr('style', dialogueContainerHeightCss);
	$('#editDialogueContainer').attr('style', dialogueContainerHeightCss);

	$("body").css('min-width', popupWidth);
	
	if (popupWidth == 700) {
		$('#filterDomainInput,#filterNameInput,#filterValueInput').css('width', '120px');
	} else if (popupWidth == 750) {
		$('#filterDomainInput,#filterNameInput,#filterValueInput').css('width', '140px');
	}
}

function setOptionsForm() {
	$('input:button').button();

	$('#confirmDeleteCookiesCheckBox').attr('checked', confirmDeleteCookies);
	$('#confirmRestoreStoredCookiesCheckBox').attr('checked', confirmRestoreStoredCookies);
	$('#restoreFixExpirationCheckBox').attr('checked', restoreFixExpiration);
	$('#confirmDeleteStoredCookiesCheckBox').attr('checked', confirmDeleteStoredCookies);

	$('#rememberFilterCheckBox').attr('checked', rememberFilter);
	$('#heightSelect').val(popupHeight);
	$('#widthSelect').val(popupWidth);
	initStyle();
}

function confirmDeleteCookies_get() {
	confirmDeleteCookies = localStorage[lsConfirmDeleteCookies];
	if (confirmDeleteCookies == undefined) {
		confirmDeleteCookies_set(true);
	} else {
		confirmDeleteCookies = /^true$/i.test(confirmDeleteCookies);
	}
}

function confirmDeleteCookies_set(val) {
	confirmDeleteCookies = val;
	localStorage[lsConfirmDeleteCookies] = confirmDeleteCookies;
}

function confirmRestoreStoredCookies_get() {
	confirmRestoreStoredCookies = localStorage[lsConfirmRestoreStoredCookies];
	if (confirmRestoreStoredCookies == undefined) {
		confirmRestoreStoredCookies_set(true);
	} else {
		confirmRestoreStoredCookies = /^true$/i.test(confirmRestoreStoredCookies);
	}
}

function confirmRestoreStoredCookies_set(val) {
	confirmRestoreStoredCookies = val;
	localStorage[lsConfirmRestoreStoredCookies] = confirmRestoreStoredCookies;
}

function restoreFixExpiration_get() {
	restoreFixExpiration = localStorage[lsRestoreFixExpiration];
	if (restoreFixExpiration == undefined) {
		restoreFixExpiration_set(true);
	} else {
		restoreFixExpiration = /^true$/i.test(restoreFixExpiration);
	}
}

function restoreFixExpiration_set(val) {
	restoreFixExpiration = val;
	localStorage[lsRestoreFixExpiration] = restoreFixExpiration;
}

function confirmDeleteStoredCookies_get() {
	confirmDeleteStoredCookies = localStorage[lsConfirmDeleteStoredCookies];
	if (confirmDeleteStoredCookies == undefined) {
		confirmDeleteStoredCookies_set(true);
	} else {
		confirmDeleteStoredCookies = /^true$/i.test(confirmDeleteStoredCookies);
	}
}

function confirmDeleteStoredCookies_set(val) {
	confirmDeleteStoredCookies = val;
	localStorage[lsConfirmDeleteStoredCookies] = confirmDeleteStoredCookies;
}

function filterDomain_get() {
	filterDomain = localStorage[lsFilterDomain];
	if (filterDomain == undefined) {
		filterDomain_set('');
	}
}

function filterDomain_set(val) {
	filterDomain = val;
	localStorage[lsFilterDomain] = filterDomain;
}

function filterName_get() {
	filterName = localStorage[lsFilterName];
	if (filterName == undefined) {
		filterName_set('');
	}
}

function filterName_set(val) {
	filterName = val;
	localStorage[lsFilterName] = filterName;
}

function filterValue_get() {
	filterValue = localStorage[lsFilterValue];
	if (filterValue == undefined) {
		filterValue_set('');
	}
}

function filterValue_set(val) {
	filterValue = val;
	localStorage[lsFilterValue] = filterValue;
}

function rememberFilter_get() {
	rememberFilter = localStorage[lsRememberFilterCloseTab];
	if (rememberFilter == undefined) {
		rememberFilter_set(true);
	} else {
		rememberFilter = /^true$/i.test(rememberFilter);
	}
}

function rememberFilter_set(val) {
	rememberFilter = val;
	localStorage[lsRememberFilterCloseTab] = rememberFilter;
}

function popupHeight_get() {
	popupHeight = localStorage[lsPopupHeight];
	if (popupHeight == undefined) {
		popupHeight_set(450);
	} else {
		popupHeight = parseInt(popupHeight, 10);
	}
}

function popupHeight_set(val) {
	popupHeight = val;
	localStorage[lsPopupHeight] = popupHeight;
}

function popupWidth_get() {
	popupWidth = localStorage[lsPopupWidth];
	if (popupWidth == undefined) {
		popupWidth_set(750);
	} else {
		popupWidth = parseInt(popupWidth, 10);
	}
}

function popupWidth_set(val) {
	popupWidth = val;
	localStorage[lsPopupWidth] = popupWidth;
}

function initStyle() {
	uiStyle = localStorage[lsUiStyle];
	if (uiStyle == undefined) {
		// it has never been selected.
		uiStyle = 'start';
	}
	$('#styleLink').attr('href', 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.12/themes/' + uiStyle + '/jquery-ui.css');
}

function saveOptions() {
	confirmDeleteCookies_set($('#confirmDeleteCookiesCheckBox').attr('checked'));
	confirmRestoreStoredCookies_set($('#confirmRestoreStoredCookiesCheckBox').attr('checked'));
	restoreFixExpiration_set($('#restoreFixExpirationCheckBox').attr('checked'));
	confirmDeleteStoredCookies_set($('#confirmDeleteStoredCookiesCheckBox').attr('checked'));
	rememberFilter_set($('#rememberFilterCheckBox').attr('checked'));
	popupHeight_set($('#heightSelect').val());
	popupWidth_set($('#widthSelect').val());
	$('#statusSpan').html('Saved!');
	setTimeout(function() {$('#statusSpan').html('');}, 1000);
}

function closeWindow() {
	window.close();
}