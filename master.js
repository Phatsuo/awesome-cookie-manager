/////////////////
// option vars //
/////////////////
const lsUiStyle = 'uiStyle';

// local storage settings key names
const lsConfirmDeleteCookies = 'confirmDeleteCookies';
const lsConfirmRestoreStoredCookies = 'confirmRestoreStoredCookies';
const lsRestoreFixExpiration = 'restoreFixExpiration';
const lsConfirmDeleteStoredCookies = 'confirmDeleteStoredCookies';
const lsFilterDomain = 'filterDomain';
const lsFilterName = 'filterName';
const lsFilterValue = 'filterValue';
const lsRememberFilterCloseTab = 'rememberFilter';
const lsPopupHeight = 'popupHeight';
const lsPopupWidth = 'popupWidth';


// local storage settings variables
let confirmDeleteCookies;
let confirmRestoreStoredCookies;
let restoreFixExpiration;
let confirmDeleteStoredCookies;
let filterDomain;
let filterName;
let filterValue;
let rememberFilter;
let popupHeight;
let popupWidth;

let uiStyle = localStorage[lsUiStyle] !== undefined ? localStorage[lsUiStyle] : 'start';
$('#styleLink').attr('href', 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.12/themes/' + uiStyle + '/jquery-ui.css');

////////////////
// popup vars //
////////////////

let hostPage;
let allCookies;
const cookieCheckBoxPrefix = 'cookieCheckBox-';
const cookieRowPrefix = 'cookieRow-';

const lsSavedCookies = 'savedCookies';
const lsMaxSavedCookies = 'maxSavedCookies';

let maxSavedCookies;

$(document).ready(function () {
	getAllOptionValues();
	hostPage = window.location.pathname.replace(/^.*\/([^\/]*)/, "$1").replace(/\.html/, '');
	if (hostPage === 'popup') {
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
	}	else if (hostPage === 'options') {
		setOptionsForm();
		$('#saveButton').click(function () {
			saveOptions();
			// update background page settings
			chrome.extension.getBackgroundPage().getAllOptionValues();
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
	for (let i=0; i < max; i++) {
		let text = i;
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
		const cookieId = $(this).attr('cookieId');
		showCookieDetails(cookieId);
		return false;
	});
	$(document).on('click', '.restoreSavedCookiesAnchor', function () {
		const cookieName = $(this).attr('cookieName');
		restoreSavedCookiesConfirm(cookieName);
		return false;
	});
	$(document).on('click', '.delete_session_anchor', function () {
		const cookieName = $(this).attr('cookieName');
		const cookieTitle = $(this).attr('cookieTitle');
		deleteSavedCookiesConfirm(cookieName, cookieTitle);
		return false;
	});

}

// keep copy of filters for comparison
let filDI = '', filNI = '', filVI = '';

function initFilterKeyPress() {

	$('#filterDomainInput').keydown(function(e){
		// call from a timer to spare some typing
		setTimeout(function() {
			const v = $("#filterDomainInput")[0].value;
			if (e.which !== 13 && filDI !== v) {loadCookies();}
			filDI = v;
		}, 200);
	});
	$('#filterNameInput').keydown(function(e){
		setTimeout(function() {
			const v = $("#filterNameInput")[0].value;
			if (e.which !== 13 && filNI !== v) {loadCookies();}
			filNI = v;
		}, 200);
	});
	$('#filterValueInput').keydown(function(e){
		setTimeout(function() {
			const v = $("#filterValueInput")[0].value;
			if (e.which !== 13 && filVI !== v) {loadCookies();}
			filVI = v;
		}, 200);
	});
}

function clearFilters() {
	$('#filterDomainInput,#filterNameInput,#filterValueInput').val('');
	loadCookies();
}

function loadCookies() {

	let tabId, storeId;
	// first get the current tab.id
	chrome.tabs.query({'active': true, 'currentWindow': true}, function(tabs) {
		tabId=tabs[0].id;
		// get the cookieStore.id using tab.id
		chrome.cookies.getAllCookieStores(function(a) {
			for (let i = 0; i < a.length; i++) {
				if (a[i].tabIds.includes(tabId)) { storeId=a[i].id; break; }
				}
			// now get cookies from this cookieStore
			chrome.cookies.getAll({'storeId': storeId}, function(cookies) {
				// ensure that filters are stored
				filDI=$("#filterDomainInput")[0].value
				filNI=$("#filterNameInput")[0].value;
				filVI=$("#filterValueInput")[0].value;

				cookies = filterCookies(cookies);
				$('#cookieCountSpan').html(addCommas(cookies.length));
				cookies.sort(sortDomain);
				allCookies = cookies;
				let html = "<table id='tab2'><tr id='row1'><td id='col0b'></td><td id='col1b'><b>Domain</b></td><td id='col2b'><b>Name</b></td><td align='right' id='col3b'><b>Expiration</b></td><td></td></tr>";
				if (cookies.length === 0) {
					html += "<tr><td colspan='5'>no cookies returned!</td></tr>";
				} else {
					for (let i = 0, cookie; cookie = cookies[i]; i++) {
						let dot=cookie.domain.search(/^\d*\./)==0;
						html += "<tr id='" + cookieRowPrefix + i + "'><td><input type='checkbox' id='" + cookieCheckBoxPrefix + i + "'></td>"
						+ '<td class="dname">' + (dot ? '<span class="tailDot">o</span><span>' : '') + cookie.domain + (dot?'</span>':'')
						+ "</td><td class='cname'><a class='cookieDetailsAnchor' cookieId='" + i + "' href=''>"
						+ (cookie.name || '?')
						+ "</a></td><td name='date' align='right'>" + formatExpirationDate(cookie.expirationDate) + "</td><td name='time' align='right'>"
						+ formatExpirationTime(cookie.expirationDate) + '</td></tr>';
					}
				}
				html += '</table>';
				$('#listDiv').html(html);
				const w1 = parseInt($('#col1b').width(), 10);
				const w2 = parseInt($('#col2b').width(), 10);
				const w3 = parseInt($('#col3b').width(), 10);
				$("#col0a").attr("width", parseInt($("#col0b").width(), 10));
				$('#col1a').attr('width', w1);
				$('#col2a').attr('width', w2);
				$('#col3a').attr('width', w3);
				$('#row1').hide();
				// shift+click range select
				$('#cookiesDiv input[type="checkbox"]').shiftSelectable();
			});
		});
	});
}

function filterCookies(cookies) {
	const newCookies = new Array();
	let filterDomainPattern;
	let filterNamePattern;
	let filterValuePattern;
	var fDtag=$("#filterDomainInput"), fNtag=$("#filterNameInput"), fVtag=$("#filterValueInput");
	filterDomain_set(fDtag.val());
	filterName_set(fNtag.val());
	filterValue_set(fVtag.val());
	try{
		if (filterDomain.length > 0) filterDomainPattern = new RegExp(filterDomain,'i');
		fDtag[0].classList.remove('error');
	}catch(e){fDtag[0].classList.add('error');}
	{
		try{
			if (filterName.length > 0) filterNamePattern = new RegExp(filterName,'i');
			fNtag[0].classList.remove('error');
		}catch(e){fNtag[0].classList.add('error'); fNtag[0].title="Invalid regular expression"; }
	}
	{
		try{
			if (filterValue.length > 0) filterValuePattern = new RegExp(filterValue,'i');
			fVtag[0].classList.remove('error');
		}catch(e){fVtag[0].classList.add('error');}
	}
	for (let i = 0, cookie; cookie = cookies[i]; i++) {
		if (filterMatch(cookie, filterDomainPattern, filterNamePattern, filterValuePattern)) {
			newCookies.push(cookie);
		}
	}
	return newCookies;
}

function filterMatch(cookie, filterDomainPattern, filterNamePattern, filterValuePattern) {
	if (filterDomainPattern === undefined && filterNamePattern === undefined && filterValuePattern === undefined) {
		return true;
	}
	if (filterDomainPattern !== undefined && cookie.domain.search(filterDomainPattern) === -1) {
		return false;
	}
	if (filterNamePattern !== undefined && cookie.name.search(filterNamePattern) === -1) {
		return false;
	}
	if (filterValuePattern !== undefined && cookie.value.search(filterValuePattern) === -1) {
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
	if (expirationDate === undefined) {
		return 'session';
	}
	const d = new Date(expirationDate * 1000);
	const date = d.getDate();
	const month = d.getMonth() + 1;
	const year = d.getFullYear();
	const hours = d.getHours();
	let minutes = d.getMinutes();
	let seconds = d.getSeconds();
	if (minutes < 10) {
		minutes = '0' + minutes;
	}
	if (seconds < 10) {
		seconds = '0' + seconds;
	}
	return !isNaN(month) && !isNaN(date) && !isNaN(year) && !isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)
		? month + '/' + date + '/' + year + ' ' + hours + ':' + minutes + ':' + seconds
		: '';
}

function formatExpirationDate(expirationDate) {
	if (expirationDate === undefined) {
		return 'session';
	}
	const d = new Date(expirationDate * 1000);
	const date = d.getDate();
	const month = d.getMonth() + 1;
	const year = d.getFullYear();

	return !isNaN(month) && !isNaN(date) && !isNaN(year)
		? month + '/' + date + '/' + year
		: '';
}

function formatExpirationTime(expirationDate) {
	if (expirationDate === undefined) {
		return '';
	}
	const d = new Date(expirationDate * 1000);
	const hours = d.getHours();
	let minutes = d.getMinutes();
	let seconds = d.getSeconds();
	if (minutes < 10) {
		minutes = '0' + minutes;
	}
	if (seconds < 10) {
		seconds = '0' + seconds;
	}
	return !isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)
		? hours + ':' + minutes + ':' + seconds
		: '';
}

function sortDomain(a, b) {
	let aStr = rootDomain(a.domain).toLowerCase();
	let bStr = rootDomain(b.domain).toLowerCase();
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
	const array = domain.split('.');
	if (array.length <= 2) {
		return domain;
	}
	return array[array.length-2] + '.' + array[array.length-1];
}

function sortIntDescending(a, b) {
	const aInt = parseInt(a, 10) * -1;
	const bInt = parseInt(b, 10) * -1;
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
	const cookie = allCookies[index];
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
	let index = parseInt($('#currentCookieId').attr('cookieId'), 10);

	if (index >= allCookies.length) {
		index = 0;
	} else if (index < 0) {
		index = allCookies.length-1;
	}

	const cookie = allCookies[index];
	$('#editDomainSpan').html(cookie.domain);
	$('#editNameSpan').html(cookie.name);
	$('#editValueCurrentDiv').html(cookie.value);
	$('#editValueNewTextArea').val(cookie.value);
	const cols = $('#editValueNewTextArea').attr('cols');
	$('#editValueNewTextArea').attr('rows', (cookie.value.length/cols)+ 2);
	$('#editExpirationDateSpan').html(formatExpirationDateTime(cookie.expirationDate));
	const dt = new Date(formatExpirationDateTime(cookie.expirationDate));
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
	const index = parseInt($('#currentCookieId').attr('cookieId'), 10);

	const currentValue = $('#editValueCurrentDiv').html();
	let newValue = String($('#editValueNewTextArea').val());
	newValue = $.trim(newValue);
	const currentExpirationDate = new Date($('#editExpirationDateSpan').html());
	const newExpirationDate = getNewExpirationDate();

	if (currentValue !== newValue || currentExpirationDate !== newExpirationDate) {
		const cookie = allCookies[index];
		// clear leading dot in domain
		const url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain.replace(/^\./,'') + cookie.path; 
		const expirationDate = newExpirationDate.getTime() / 1000;
		// NOTE: do not specify the domain. "domain:cookie.domain" - domains like "ads.undertone.com" will end up as ".ads.undertone.com"
		let ck={url:url, name:cookie.name, value:newValue, path:cookie.path, secure:cookie.secure, httpOnly:cookie.httpOnly, expirationDate:expirationDate, storeId:cookie.storeId};
		// chrome 80+: set ck.domain when it starts with a dot
		if (cookie.domain[0]=='.') { ck.domain=cookie.domain; }
		chrome.cookies.set(ck, function() {
			let err=chrome.runtime.lastError;
			if (err) console.info('saveCookieEdits() Error:', err.message);
			cookie.value = newValue;
			cookie.expirationDate = expirationDate;
			$('#detailsValueDiv').html(cookie.value);
			$('#detailsExpirationDateSpan').html(formatExpirationDateTime(cookie.expirationDate));
			$("#cookieDetailsDiv").dialog( "option", "maxHeight", 600);
			$('#editCookieDiv').dialog('close');
			if (currentExpirationDate !== newExpirationDate) {
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
		let selected = 0;
		for (let i = 0, cookie; cookie = allCookies[i]; i++) {
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
		const removedIndexes = new Array();
		for (var i = 0, cookie; cookie = allCookies[i]; i++) {
			if ($('#' + cookieCheckBoxPrefix + i).attr('checked')) {
				removedIndexes.push(i);
				removeCookie(i, cookie);
			}
		}
		removedIndexes.sort(sortIntDescending);
		for (var i = 0; i < removedIndexes.length; i++) {
			const index = removedIndexes[i];
			allCookies.splice(index, 1);
			$('#' + cookieRowPrefix + index).hide();
		}
		$('#cookieCountSpan').html(addCommas(allCookies.length));
		// fix cookie number discrepancies
		loadCookies();
	}
}

function removeCookie(index, cookie) {
	const url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
	chrome.cookies.remove({url:url, name:cookie.name, storeId:cookie.storeId}, function(){

	});
}

function nextTheme(add) {
	let id = parseInt($('#styleSelect option:selected').attr('id'), 10) + add;
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

	let title = '';

	const filterDomain = $("#filterDomainInput").val();
	const filterName = $("#filterNameInput").val();
	const filterValue = $("#filterValueInput").val();

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

	if (title.length === 0) {
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
	if (maxSavedCookies === undefined) {
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
	const next = 0;
	for (let i = 0; i <= maxSavedCookies; i++) {
		if (localStorage[savedCookiesName(i)] === undefined) {
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
	const aStr = a.title.toLowerCase() + new Date(a.saved).getTime();
	const bStr = b.title.toLowerCase() + new Date(b.saved).getTime();
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
	const title = $('#savedCookiesTitle').val();
	if (title.length === 0) {
		$('#saveCookiesErrorSpan').html('Title is required.');
		return;
	}
	const cookies = new Array();
	for (let i = 0, cookie; cookie = allCookies[i]; i++) {
		if ($('#' + cookieCheckBoxPrefix + i).attr('checked')) {
			cookies.push(cookie);
		}
	}
	if (cookies.length === 0) {
		$('#saveCookiesErrorSpan').html('Could not save. No cookies have been selected (checked) for saving.&nbsp;&nbsp;&nbsp;<a href="" id="selectAllCookiesAnchor">select all</a>');
		return;
	}

	const date = new Date;
	const savedCookies = {title: title, saved: String(date), savedTS: date.getTime(), cookies: cookies};
	const savedCookiesName = nextSavedCookiesName();
	localStorage[savedCookiesName] = JSON.stringify(savedCookies);
	showSavedCookieList();
}

function showSavedCookieList() {
	$('#savedCookiesDiv').html('');
	let html = '<table><tr><td></td><td><b>Title</b></td><td><b>Saved</b></td><td><b>Cookies</b></td><td><b>Delete</b></td></tr>';
	maxSavedCookies_get();
	const savedCookiesArray = new Array();
	for (var i = 0; i <= maxSavedCookies; i++) {
		if (localStorage[savedCookiesName(i)] !== undefined) {
			var savedCookies = JSON.parse(localStorage[savedCookiesName(i)]);
			savedCookiesArray.push({name:savedCookiesName(i), title:savedCookies.title, saved:savedCookies.saved, cookieCount:savedCookies.cookies.length,
				isInco: savedCookies.cookies[0].storeId=="0"?false:true });
		}
	}
	savedCookiesArray.sort(sortSavedCookies);
	for (var i = 0, savedCookies; savedCookies = savedCookiesArray[i]; i++) {
		const icon = savedCookies.cookieCount === 1 ? 'application.png' : savedCookies.cookieCount === 2 ? 'application_double.png' : 'application_cascade.png';
		html += "<tr>";
		html += "<td"+(savedCookies.isInco?' class="inco"':'')+"><a class='restoreSavedCookiesAnchor' cookieName='" + savedCookies.name + "' href='' title='Restore Saved Cookies'><img src='" + icon + "' class='move-icon-down'></a></td>";
		html += "<td><a class='restoreSavedCookiesAnchor' cookieName='" + savedCookies.name + "' href='' title='Restore Saved Cookies'>" + savedCookies.title + "</a></td>";
		html += "<td>" + String(savedCookies.saved).replace(/ GMT.+/, '') + "</td>";
		html += "<td align='center'>" + addCommas(savedCookies.cookieCount) + "</td>";
		const cookieTitle = savedCookies.title.replace(/'/g, "\'").replace(/"/g, '');
		html += "<td align='center'><a class='delete_session_anchor' cookieName='" + savedCookies.name + "' cookieTitle='" + cookieTitle + "' title='Delete Saved Cookies'><img class='delete-session-img move-icon-down' src='tab_close_2.png' class='move-icon-down'></a></td>";
		html += "</tr>";
	}
	html += '</table>';
	if (savedCookiesArray.length === 0) {
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
	const x = nStr.split('.');
	let x1 = x[0];
	const x2 = x.length > 1 ? '.' + x[1] : '';
	const rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}

function showConfirm(title, msg, func, p1, p2) {
	const confirmFunction = func;
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
		const savedCookies = JSON.parse(localStorage[savedCookiesName]);
		showConfirm('Restore Saved Cookies', 'Are you sure you want to restore these Saved Cookies?<br/><br/>' + savedCookies.title, restoreSavedCookies, savedCookiesName, null);
	} else {
		restoreSavedCookies(true, savedCookiesName);
	}
}

function restoreSavedCookies(restore, savedCookiesName) {
	if (restore) {
		const bg = chrome.extension.getBackgroundPage();
		bg.restoreSavedCookiesBackground(savedCookiesName, loadCookies);
	}
}

function restoreSavedCookiesBackground(savedCookiesName, callback) {
	const savedCookies = JSON.parse(localStorage[savedCookiesName]);
	if (savedCookies === undefined || savedCookies.cookies === undefined) {
		$('#saveCookiesErrorSpan').html('Error restoring saved cookies.');
		return;
	}
	for (let i = 0, cookie; cookie = savedCookies.cookies[i]; i++) {
		restoreCookie(cookie);
	}
	if (callback !== undefined) {
		callback();
	}
}

function restoreCookie(cookie) {
	// clear leading dot in domain
	const url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain.replace(/^\./,'') + cookie.path;
	let expirationDate = cookie.expirationDate;
	if (restoreFixExpiration && expirationDate !== undefined) {
		const exp = new Date(expirationDate * 1000);
		const now = new Date();
		if (exp < now) {
			expirationDate += 31556926;
		}
	}

	// NOTE: do not specify the domain. "domain:cookie.domain" - domains like "ads.undertone.com" will end up as ".ads.undertone.com"
	var ck={url:url, name:cookie.name, value:cookie.value, path:cookie.path, secure:cookie.secure, httpOnly:cookie.httpOnly, expirationDate:expirationDate, storeId:cookie.storeId};
	// chrome 80+: set ck.domain when it starts with a dot
	if (cookie.domain[0]=='.') { ck.domain=cookie.domain; }
	// read lasterror to prevent error when call fails
	chrome.cookies.set(ck, function(){
		let err=chrome.runtime.lastError;
		if (err) console.info('restoreCookie() Error:', err.message);
		});
}

function getNewExpirationDate() {
	const dt = new Date($('#newExpirationDatePicker').datepicker('getDate'));
	const hours = parseInt($('#newExpirationHours').val(), 10);
	const minutes = parseInt($('#newExpirationMinutes').val(), 10);
	const seconds = parseInt($('#newExpirationSeconds').val(), 10);
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

	if (rememberFilter && filterDomain !== undefined && filterDomain != null && filterDomain !== '' && filterDomain.length > 0 && filterDomain !== 'undefined') {
		$('#filterDomainInput').val(filterDomain);
	}

	if (rememberFilter && filterName !== undefined && filterName != null && filterName !== '' && filterName.length > 0 && filterName !== 'undefined') {
		$('#filterNameInput').val(filterName);
	}

	if (rememberFilter && filterValue !== undefined && filterValue != null && filterValue !== '' && filterValue.length > 0 && filterValue !== 'undefined') {
		$('#filterValueInput').val(filterValue);
	}

	const cookiesDivHeightCss = 'height:' + popupHeight + 'px; overflow:auto;';
	$('#cookiesDiv').attr('style', cookiesDivHeightCss);

	const dialogueContainerHeightCss = 'height:' + (popupHeight - 100) + 'px; overflow:auto;';
	$('#detailsDialogueContainer').attr('style', dialogueContainerHeightCss);
	$('#editDialogueContainer').attr('style', dialogueContainerHeightCss);

	$("body").css('min-width', popupWidth);

	if (popupWidth === 700) {
		$('#filterDomainInput,#filterNameInput,#filterValueInput').css('width', '120px');
	} else if (popupWidth === 750) {
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
	if (confirmDeleteCookies === undefined) {
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
	if (confirmRestoreStoredCookies === undefined) {
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
	if (restoreFixExpiration === undefined) {
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
	if (confirmDeleteStoredCookies === undefined) {
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
	if (filterDomain === undefined) {
		filterDomain_set('');
	}
}

function filterDomain_set(val) {
	filterDomain = val;
	localStorage[lsFilterDomain] = filterDomain;
}

function filterName_get() {
	filterName = localStorage[lsFilterName];
	if (filterName === undefined) {
		filterName_set('');
	}
}

function filterName_set(val) {
	filterName = val;
	localStorage[lsFilterName] = filterName;
}

function filterValue_get() {
	filterValue = localStorage[lsFilterValue];
	if (filterValue === undefined) {
		filterValue_set('');
	}
}

function filterValue_set(val) {
	filterValue = val;
	localStorage[lsFilterValue] = filterValue;
}

function rememberFilter_get() {
	rememberFilter = localStorage[lsRememberFilterCloseTab];
	if (rememberFilter === undefined) {
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
	if (popupHeight === undefined) {
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
	if (popupWidth === undefined) {
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
	if (uiStyle === undefined) {
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
