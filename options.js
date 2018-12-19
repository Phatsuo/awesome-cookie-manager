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

$(document).ready(function () {
	hostPage = window.location.pathname.replace(/^.*\/([^/]*)/, "$1").replace(/\.html/, '');
	getAllOptionValues();
	if (hostPage == 'options') {
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
		popupHeight = parseInt(popupHeight);
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
		popupWidth = parseInt(popupWidth);
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