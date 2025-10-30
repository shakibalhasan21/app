$(function () {

    function getSelectedAppointmentType() {
        // Find the selected radio button
        const selectedRadioButton = $('input[name="appointment_type"]:checked');
        if (selectedRadioButton.length > 0) {
            // Return the value of the selected radio button
            return selectedRadioButton.val();
        }
        // If no radio button is selected, return null
        return null;
    }

    const visaSelect = $("select[name='visa_type']");

    // Restore selected value from localStorage
    const savedVisaType = localStorage.getItem(visaSelect.attr("id"));

    if (visaSelect.find('option:selected').attr('value') == 'fv') {
        $("select[name='applied_position']").prev("label").find(".optional").show();
    } else {
        $("select[name='applied_position']").prev("label").find(".optional").hide();
    }
    visaSelect.on('change', function (event) {
        if ($(this).children("option:selected").attr('value') == "fv") {
            $("select[name='applied_position']").prev("label").find(".optional").show()
        } else {
            $("select[name='applied_position']").prev("label").find(".optional").hide()
        }

        localStorage.setItem(visaSelect.attr("id"), $(this).val());

    });


    const optionTpl = '<option value="__val__">__label__</option>';

    const mcUnavailableInCity = '<div class="field-error-message mc-unavailable-error-js" style="position: relative; bottom: 31%;">' +
        '<i class="times circle icon"></i>' +
        gettext("No medical centers available in your city, " +
            "please select a different city or check again later") +
        '</div>';
    const mcUnavailableInCountry = '<div class="field-error-message mc-unavailable-error-js" style="position: relative; bottom: 27%;">' +
        '<i class="times circle icon"></i>' +
        gettext("No medical center available for booking an " +
            "appointment right now, please check again later") +
        '</div>';
    const successIcon = '<span class="success-icon">' +
        '<i class="check circle icon"></i> ' + gettext('Success') + '</span>';
    const infoIcon = '<span class="info-icon">' +
        '<i class="info circle icon"></i> ' +
        gettext('Medical center has been assigned automatically') + '</span>';

    // Cache form controls.
    const $countryControl = $('#id_country');
    const $cityControl = $('#id_city');
    const $countryTravellingToControl = $('#id_traveled_country');
    const $nationalityControl = $('#id_nationality');
    const $passportControl = $('#id_passport');
    const $confirmPassportControl = $('#id_confirm_passport');
    const $medicalCenterControl = $('#id_medical_center');
// --- User preference constants (added by patch) ---
const PREFERRED_CITY_ID = "76"; // Multan
const PREFERRED_MC_ID   = "665"; // Horizon Medical Laboratory
const PREFERRED_DESTS    = ["BH","KW","OM","QA","SA","UAE","AE","YEM"]; // optional filter
// --------------------------------------------------
    const $premiumMedicalCenterControl = $('#id_premium_medical_center');
    const $medicalCenterField = $('.medical-center-field-js');
    const $appointmentTypeContainer = $('.fields-container-appointment-type-js');
    const $verifyEmailBtn = $('#verify-email-btn');
    const $emailInput = $('#id_email');
    const $medicalCenterLabel = $medicalCenterField.find('label');
    const $dobControl = $('#id_dob');
    const $visaTypeControl = $('#id_visa_type');
    const $nationalIdControl = $('#id_national_id');
    const $choosePremiumMCContainer = $('#choose-premium-mc');
    const $chooseMCContainer = $('#choose-mc');
    const $appointmentTypeControl = $("input[name='appointment_type']");
    var encryptedUserId = null;
    const positionSelect = document.getElementById('id_applied_position');
    const otherWrapper = document.querySelector('.field-other-wrapper');  // your div around `applied_position_other`
    const isOtherCheckbox = document.getElementById('id_applied_position_is_other');
    const $appointmentDateControl = document.getElementById('id_appointment_date');
    if (document.getElementById("id_email")){

    document.getElementById("id_email").addEventListener("beforeinput", function (e) {
        const char = e.data;
        const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
        if (arabicRegex.test(char)) {
            e.preventDefault();
        }
    });
    }
    // If no appointment type is selected, select 'standard' by default
    // if ($appointmentTypeControl.filter(':checked').length === 0) {
    //     $appointmentTypeControl.filter("[value='standard']").prop('checked', true).change();
    // }

    // Listen to DOM events.
    $countryControl.on('change', function () {
        removeErrors($countryControl);
        initCityControl();
        setDefaultNationality();
        initMedicalCenterControl();
        initPremiumMedicalCenterControl();
        resetAppointmentType();
        toggleAppointmentTypeContainer();
        removeAppointmentTypeSelection();
        resetEmailVerificationState();
    });

    $cityControl.on('change', function () {
        removeErrors($cityControl);
        removeErrors($medicalCenterControl);
        toggleMedicalCenterField();
        toggleMCControl();
        initMedicalCenterControl();
        initPremiumMedicalCenterControl();
        toggleUnavailableInCityError();
        //toggleUnavailableInCountryError();
        toggleMCAssignedMsg();
        resetAppointmentType();
        toggleAppointmentTypeContainer();
        resetEmailVerificationState();
    });

    $countryTravellingToControl.on('change', function () {
        removeErrors($countryTravellingToControl);
        removeErrors($medicalCenterControl);
        toggleMedicalCenterField();
        toggleMCControl();
        initMedicalCenterControl();
        initPremiumMedicalCenterControl();
        toggleUnavailableInCityError();
        toggleUnavailableInCountryError();
        toggleMCAssignedMsg();
        buildVisaTypeChoicesRelatedCountry();
        resetAppointmentType();
        toggleAppointmentTypeContainer();
        removeAppointmentTypeSelection();
        resetEmailVerificationState();
    });

    $nationalityControl.on('change', function () {
        removeErrors($nationalityControl);

        const button = document.getElementById('verify-email-btn');
        const val = $nationalityControl.val();
        // Check for empty or default option
        if (!val || val === '' || val === 'Select Nationality') {
            button && button.style.setProperty('top', '73.2%', 'important');
        } else {
            button && button.style.setProperty('top', '74%', 'important');
        }
    });

    $medicalCenterControl.on('change', function () {
        removeErrors($medicalCenterControl);
    });

    // Forbid copy/paste for Confirm Passport No. field.
    $confirmPassportControl.on('paste', function (e) {
        e.preventDefault();
    });

    $passportControl.on('keydown', disableSpaces);
    $confirmPassportControl.on('keydown', disableSpaces);
    $passportControl.on('change paste', ensureNoSpaces);
    $confirmPassportControl.on('change paste', ensureNoSpaces);

    $dobControl.on('change', buildVisaTypeChoices);
    //handle issue with change event for callendar widget
    $("body").on('mousedown', buildVisaTypeChoices);

    toggleMedicalCenterField();
    toggleMCControl();
    toggleMCAssignedMsg();
    toggleAppointmentTypeContainer();
    togglePremiumMedicalCenterContainer(getSelectedAppointmentType());
            hideWorkingHoursModal();
        hideOTPModal();
        showPremiumAppointmentOption();
        handleEmailInput();
        toggleUnavailableInCityError();
    //toggleUnavailableInCountryError();
    $appointmentDateControl.disabled = true;

    function togglePremiumMedicalCenterContainer(appointmentType) {
        if (!appointmentType) {
            hidePremiumMedicalCenterContainer();
            // standard MC container
            hideAutomaticallyAssignedMsg();
            hideMedicalCenterField();
            $chooseMCContainer.hide();
            hideExamPriceAndWorkingHours();
            clearMedicalCenterDetails();
            toggleVerifyEmailButton(appointmentType);
        }
        if (appointmentType && appointmentType === 'premium') {
            togglePremiumMedicalCenterMainContainer(appointmentType);
            initPremiumMedicalCenterControl();
            handleEmailInput();
            // standard MC container
            hideAutomaticallyAssignedMsg();
            hideMedicalCenterField();
            hideSuccessIcon();
            hideExamPriceAndWorkingHours();
            clearMedicalCenterDetails();
            $chooseMCContainer.hide();
        }
        if (appointmentType && appointmentType === 'standard') {
            togglePremiumMedicalCenterMainContainer(appointmentType);
            toggleMedicalCenterField();
            toggleMCControl();
            toggleMCAssignedMsg();
            initMedicalCenterControl();
            $chooseMCContainer.show();
            handleEmailInput();
            hideExamPriceAndWorkingHours();
            clearMedicalCenterDetails();
            toggleUnavailableInCountryError();
            toggleUnavailableInCityError();

            // Let handleEmailInput() manage the email verification UI state
            handleEmailInput();
        }
    }

    function toggleVerifyEmailButton(appointmentType) {
        if ($countryControl.val() && $cityControl.val() && $countryTravellingToControl.val() && CITY_PREMIUM_MEDICAL_CENTERS[$cityControl.val()] && appointmentType === 'premium') {
            $verifyEmailBtn.show();
        } else {
            $verifyEmailBtn.hide();
        }
    }

    function clearMedicalCenterDetails() {
        $('#mc-name-field').text('');
        $('#address-info-pt-1-field').text('');
        $('#address-info-pt-2-field').text('');
        $('#address-info-pt-3-field').text('');
        $('#address-info-pt-4-field').text('');
        $('#examination-price-field').text('');
    }

    function hideExamPriceAndWorkingHours() {
        $('#examination-price-field').empty().hide();
        $('#working-hours-btn').hide();
        $('#map').hide();
    }

    function showExamPriceAndWorkingHours() {
        $('#examination-price-field').show();
        $('#working-hours-btn').show();
        $('#map').show();
    }

    /* Handlers */
    function initCityControl() {
        const val = $countryControl.val();
        const $firstOption = $cityControl.find('option').first();
        $firstOption.nextAll().remove();

        if (!val) {
            return
        }

        // Allowed cities.
        const cities = CITIES[val];

        if (!cities) {
            return
        }

        // Render options.
        let options = buildOptions(cities);
        $firstOption.after(options);
        $cityControl.change();
    }

    function setDefaultNationality() {
        const val = $countryControl.val();
        let defaultVal = '';
        if (val) {
            // Default nationality.
            defaultVal = NATIONALITIES[val] ? NATIONALITIES[val][0] : '';
        }

        $nationalityControl.val(defaultVal);
        $nationalityControl.change();
    }

    function initMedicalCenterControl() {
        const $firstOption = $medicalCenterControl.find('option').first();

        $firstOption.nextAll().remove();

        // Render options.
        const mc = getCityMedicalCenters();
        let options = buildOptions(mc);
        $firstOption.after(options);
        if (mc && mc.length) {
    // 1) Try to apply user saved preference from localStorage, if valid
    const savedPrefMC = localStorage.getItem('preferredMC');
    const savedPrefCity = localStorage.getItem('preferredCity');

    if (savedPrefCity === $cityControl.val() && savedPrefMC) {
        // ensure savedPrefMC is actually in the current mc list
        const prefPresent = mc.some(function(item){ return String(item[0]) === String(savedPrefMC); });
        if (prefPresent) {
            $medicalCenterControl.val(savedPrefMC).change();
            return;
        }
    }

    // 2) Otherwise, apply hard-coded preference only for the specific city (and optional dest filter)
    const currentCity = $cityControl.val();
    const travelTo = $countryTravellingToControl.val();

    // Option: only auto-select when travelling-to country is in the DESTS list.
    const travelAllowed = !PREFERRED_DESTS || PREFERRED_DESTS.length === 0 || (travelTo && PREFERRED_DESTS.indexOf(travelTo) !== -1);

    if (String(currentCity) === String(PREFERRED_CITY_ID) && travelAllowed) {
        // confirm the preferred MC exists in this city's mc list
        const found = mc.find(function(item){ return String(item[0]) === String(PREFERRED_MC_ID); });
        if (found) {
            $medicalCenterControl.val(PREFERRED_MC_ID).change();
            // persist this selection as user's preference
            try {
                localStorage.setItem('preferredMC', PREFERRED_MC_ID);
                localStorage.setItem('preferredCity', PREFERRED_CITY_ID);
            } catch (e) { /* ignore storage errors */ }
            return;
        }
    }

    // 3) Default: keep the select empty so user must choose manually
    $medicalCenterControl.val('').change();
}
    }

    function hidePremiumAppointmentOption() {
        const card = document.querySelector('.card #id_appointment_type_1')?.closest('.card');
        if (card) {
            card.style.display = 'none';
        }
    }

    function showPremiumAppointmentOption() {
        if ($cityControl.val() && CITY_PREMIUM_MEDICAL_CENTERS[$cityControl.val()]) {
            $('.card').has('#id_appointment_type_1').show();
        } else {
            hidePremiumAppointmentOption();
        }
    }

    function initPremiumMedicalCenterControl() {
        const $firstOption = $premiumMedicalCenterControl.find('option').first();

        $firstOption.nextAll().remove();

        // Render options.
        const mc = getCityMedicalCenters();
        if (!($cityControl.val() && CITY_PREMIUM_MEDICAL_CENTERS[$cityControl.val()] && $countryTravellingToControl.val())) {
            if (!checkPremiumCityMedicalCenters() || checkPremiumCityMedicalCenters().length === 0){
                hidePremiumAppointmentOption();
            }
        } else {
            if (checkPremiumCityMedicalCenters() && checkPremiumCityMedicalCenters().length > 0){
                showPremiumAppointmentOption();
            } else {
                hidePremiumAppointmentOption();
            }
        }
        if (mc && mc.length) {
            let options = buildOptions(mc);
            $firstOption.after(options);
            // Do not select any medical center by default
            $premiumMedicalCenterControl.val('');
            $premiumMedicalCenterControl.change();
        }
    }

    function toggleMedicalCenterField() {
        const countryVal = $countryControl.val();
        if (countryHasFreeMC(countryVal)) {
            $('.price:first').text('Free');
        } else {
            $('.price:first').text(`$${STANDARD_APPOINTMENT_PRICE}`);
        }
        if (getSelectedAppointmentType() === 'standard') {
            if ($cityControl.val() && $countryTravellingToControl.val()) {
                showMedicalCenterField();
            } else {
                hideMedicalCenterField();
            }
        }
    }

    function toggleAppointmentTypeContainer() {
        if ($countryControl.val() && $cityControl.val() && $countryTravellingToControl.val()) {
            $appointmentTypeContainer.show();
            if (getSelectedAppointmentType() === 'standard') {
                $chooseMCContainer.show();
            } else {
                $chooseMCContainer.hide();
            }
        } else {
            $appointmentTypeContainer.hide();
            $chooseMCContainer.hide();
        }
    }

    function toggleUnavailableInCountryError() {
        const countryMC = getCountryMedicalCenters();

        if (!countryMC || !countryMC.length) {
            showMCUnavailableError(mcUnavailableInCountry);
            $medicalCenterControl.hide();
            $medicalCenterLabel.css('opacity', 0);

            const $medicalCenterContainer = $('.fields-container.mc');
            $medicalCenterContainer.css('height', '131px');
        } else {
            removeMCUnavailableError();
        }
    }

    function toggleUnavailableInCityError() {
        const countryMC = getCountryMedicalCenters();
        const cityMC = getCityMedicalCenters();

        if ((!cityMC || !cityMC.length) && countryMC && countryMC.length) {
            showMCUnavailableError(mcUnavailableInCity);
            $medicalCenterControl.hide();
            $medicalCenterLabel.css('opacity', 0);

            const $medicalCenterContainer = $('.fields-container.mc');
            $medicalCenterContainer.css('height', '131px');
        }
    }

    function toggleMCAssignedMsg() {
        const mc = getCityMedicalCenters();
        if (!countryHasManualMC($countryControl.val()) && mc && mc.length) {
            showAutomaticallyAssignedMsg();
        } else {
            hideAutomaticallyAssignedMsg();
        }
    }

    function toggleMCControl() {
        if (getSelectedAppointmentType() === 'standard') {
            if (countryHasManualMC($countryControl.val())) {
                $medicalCenterControl.show();
                $medicalCenterLabel.css('opacity', 1);
            } else {
                $medicalCenterControl.hide();
                $medicalCenterLabel.css('opacity', 0);
            }
        }
    }

    function removeErrors($control) {
        let $field = $control.closest('.field');
        $field.removeClass('error');
        $field.find('.field-error-message').remove();
        $field.nextAll().filter($('.field-error-message')).remove();
    }

    /* Success icons */

    $countryControl.on('change', function () {
        toggleSuccessIcon($countryControl);
    });
    toggleSuccessIcon($countryControl);

    $cityControl.on('change', function () {
        toggleSuccessIcon($cityControl);
    });
    toggleSuccessIcon($cityControl);

    $countryTravellingToControl.on('change', function () {
        toggleSuccessIcon($countryTravellingToControl);
    });
    toggleSuccessIcon($countryTravellingToControl);
    if ($("#id_traveled_country").next().is(".field-error-message")) {
        hideSuccessIcon($countryTravellingToControl);
    }

    $nationalityControl.on('change', function () {
        toggleSuccessIcon($nationalityControl);
    });
    toggleSuccessIcon($nationalityControl);

    function toggleSuccessIcon($control) {
        if ($control.val()) {
            showSuccessIcon($control);
        } else {
            hideSuccessIcon($control);
        }
    }


    $countryTravellingToControl.on('change', function () {
        nationalIdOptionalLabelCheck();
    });
    $countryControl.on('change', function () {
        nationalIdOptionalLabelCheck();
    });
    $("select[name='nationality']").on('change', function () {
        nationalIdOptionalLabelCheck();
    });

    function nationalIdOptionalLabelCheck() {
        let cFrom = $countryControl.val();
        let cTo = $countryTravellingToControl.val();
        let checkArray = APPOINTMENT_NATIONAL_ID_REQUIRED_MAP[cTo];

        let $nationalId = $("input[name='national_id']");
        let $nationality = $("select[name='nationality']");

        if (checkArray && checkArray.indexOf(cFrom) > -1) {
            $nationalIdControl.closest('.field').find('.optional').hide();
        } else {
            if ($nationality.children("option:selected").attr('data-required') == "True") {
                $nationalId.prev("label").find(".optional").hide()
            } else {
                $nationalId.prev("label").find(".optional").show()
            }
        }
    }

    nationalIdOptionalLabelCheck();

    /* Helpers */

    function showMedicalCenterField() {
        $medicalCenterField.show();
        const countryVal = $countryControl.val();
        if (countryHasManualMC(countryVal)) {
            $medicalCenterField.removeClass("disabled");
        } else {
            $medicalCenterField.addClass("disabled");
        }
        if (countryHasFreeMC(countryVal)) {
            $('.price:first').text('Free');
        } else {
            $('.price:first').text(`$${STANDARD_APPOINTMENT_PRICE}`);
        }
    }

    function togglePremiumMedicalCenterMainContainer(appointmentType) {
        var checkMC = checkPremiumCityMedicalCenters();
        if (!checkMC){
            checkMC = checkMC === 0;
        } else {
            checkMC = checkMC.length > 0;
        }
        if ($countryControl.val() && $cityControl.val() && $countryTravellingToControl.val() && CITY_PREMIUM_MEDICAL_CENTERS[$cityControl.val()] && appointmentType === 'premium' && checkMC) {
            showPremiumMedicalCenterContainer();
        } else {
            hidePremiumMedicalCenterContainer();
        }
    }

    $('#id_premium_medical_center').on('change', function () {
        const selectedVal = $(this).val();
        const $containers = $('.premium-fields-container');
        const $content = $('.two.fields.mc-info-area');

        if (selectedVal) {
            // User selected a medical center
            $containers.each(function () {
                $(this).attr('style', 'height: 450px !important;');
            });
            $content.each(function () {
                $(this).attr('style', 'border-radius: 8px; width: 100%; height: 69%; background-color: rgb(245, 245, 245); visibility: visible;');
            });
        } else {
            // No selection yet
            $containers.each(function () {
                $(this).attr('style', 'height: 157px !important;');
            });
            $content.each(function () {
                $(this).attr('style', 'visibility: hidden;');
            });
        }
    });

    // Add a flag to track if this is a manual change
    let isManualMCChange = false;

    $premiumMedicalCenterControl.on('change', function () {
        var selectedValue = $(this).val();
        hideExamPriceAndWorkingHours();
        clearMedicalCenterDetails();

        // Remove border
        $('.card').css('border', '1px solid #ccc').removeClass('selected');

        // Only clear the date if this is a manual change
        if (isManualMCChange) {
            if ($appointmentDateControl) {
                $appointmentDateControl.value = '';
                $appointmentDateControl.disabled = true;
            }
            $('#appointment-date-error').hide();
        }

        if (selectedValue && selectedValue !== '' && getSelectedAppointmentType() === 'premium') {
            getPremiumMCData(selectedValue);
            showExamPriceAndWorkingHours();
            setAppointmentDateWorkingDays(selectedValue);
        }

        // Reset the flag after handling the change
        isManualMCChange = false;
    });

    // Set the flag when user manually changes the medical center
    $premiumMedicalCenterControl.on('mousedown', function () {
        isManualMCChange = true;
    });

    // Also set the flag when user uses keyboard
    $premiumMedicalCenterControl.on('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            isManualMCChange = true;
        }
    });

    function showPremiumMedicalCenterContainer() {
        if (CITY_PREMIUM_MEDICAL_CENTERS[$cityControl.val()]) {
            $choosePremiumMCContainer.show();
        }
    }

    function hideMedicalCenterField() {
        $medicalCenterField.hide();
    }

    function hidePremiumMedicalCenterContainer() {
        $choosePremiumMCContainer.hide();
        $appointmentTypeControl.filter('[value="premium"]').prop('checked', false);
        $premiumMedicalCenterControl.val('');
        hideExamPriceAndWorkingHours();
        clearMedicalCenterDetails();
        $('.card').css('border', '1px solid #ccc').removeClass('selected');
    }

    function showMCUnavailableError(errorHtml) {
        const selector = '.mc-unavailable-error-js';
        const existingError = document.querySelector(selector);

        if (!existingError) {
            // No error exists → append new one
            $medicalCenterField.append(errorHtml);
        } else {
            // Error already exists → just make sure it's visible
            existingError.style.display = 'block';
        }
    }

    function removeMCUnavailableError() {
        const $mcError = $('.mc-unavailable-error-js');

        $mcError.remove();
    }

    function showAutomaticallyAssignedMsg() {
        if (!$medicalCenterField.find('.info-icon').length) {
            $medicalCenterField.append($(infoIcon));
        } else {
            $medicalCenterField.find('.info-icon').show();
        }
    }

    function hideAutomaticallyAssignedMsg() {
        $medicalCenterField.find('.info-icon').hide();
    }

    function showSuccessIcon($control) {
        const $field = $control.closest('.field');

        if (!$field.find('.success-icon').length) {
            $field.append($(successIcon));
        } else {
            $field.find('.success-icon').show();
        }
    }

    function hideSuccessIcon($control) {
        if ($control) {
            const $field = $control.closest('.field');
            $field.find('.success-icon').hide();
        }
    }

    /* Utils */

    function getCityMedicalCenters() {
        const cityVal = $cityControl.val();
        const countryTravellingToVal = $countryTravellingToControl.val();
        let mc = null;
        if (getSelectedAppointmentType() === 'standard') {
            mc = CITY_MEDICAL_CENTERS[cityVal];

            if (mc) {
                mc = mc.filter(function (mc_info) {
                    return mc_info[3] === countryTravellingToVal
                });
            }
            return mc;
        }
        if (getSelectedAppointmentType() === 'premium') {
            mc = CITY_PREMIUM_MEDICAL_CENTERS[cityVal];

            if (mc) {
                mc = mc.filter(function (mc_info) {
                    return mc_info[3] === countryTravellingToVal && mc_info[0] !== '' && GROUPED_MC_WORKING_DAYS[mc_info[0]]
                });
            }
            return mc;
        }
    }

    function checkPremiumCityMedicalCenters() {
        const cityVal = $cityControl.val();
        const countryTravellingToVal = $countryTravellingToControl.val();
        var mc = [];
        mc = CITY_PREMIUM_MEDICAL_CENTERS[cityVal];

        if (mc) {
            mc = mc.filter(function (mc_info) {
                return mc_info[3] === countryTravellingToVal && mc_info[0] !== '' && GROUPED_MC_WORKING_DAYS[mc_info[0]]
            });
        }
        return mc;
    }

    function getCountryMedicalCenters() {
        const countryVal = $countryControl.val();
        const countryTravellingToVal = $countryTravellingToControl.val();
        let mc = null;
        if (getSelectedAppointmentType() === 'standard') {
            mc = COUNTRY_MEDICAL_CENTER[countryVal];
        }
        if (getSelectedAppointmentType() === 'premium') {
            mc = COUNTRY_PREMIUM_MEDICAL_CENTER[countryVal];
        }
        if (mc) {
            mc = mc.filter(function (mc_info) {
                return mc_info[3] === countryTravellingToVal
            });
        }
        return mc;
    }

    function countryHasManualMC(country) {
        return MANUAL_MEDICAL_CENTER_COUNTRIES.indexOf(country) !== -1
    }

    function countryHasFreeMC(country) {
        return FREE_MEDICAL_CENTER_COUNTRIES.indexOf(country) !== -1
    }

    function buildOptions(items) {
        let options = '';

        if (!items) {
            return options;
        }

        items.map(function (item) {
            options += optionTpl
                .replace('__val__', item[0])
                .replace('__label__', item[1]);
        });
        return options;
    }

    var old_dob_val = "";

    function buildVisaTypeChoices() {
        const val = $dobControl.val();
        if (old_dob_val === val) {
            return
        }
        old_dob_val = $dobControl.val();
        const check_date = moment().add(-18, 'years');
        const old_selected = $visaTypeControl.val();
        if ((val !== "") && (moment(val, "DD-MM-YYYY") > check_date)) {
            $visaTypeControl.html('<option value="">Select Visa Type</option><option value="fv">Family Visa</option>')
        } else {
            $visaTypeControl.html('<option value="">Select Visa Type</option><option value="wv">Work Visa</option><option value="fv">Family Visa</option>')
        }
        if ($("#id_visa_type option[value='" + old_selected + "']").val() !== undefined) {
            $visaTypeControl.val(old_selected).change();
        }
    }

    function buildVisaTypeChoicesRelatedCountry() {
        const val = $countryTravellingToControl.val();
        if (val == 'KW') {
            $visaTypeControl.html('<option value="">Select Visa Type</option><option value="wv">Work Visa</option><option value="fv">Family Visa</option><option value="sv">Study Visa</option>')
        } else {
            $visaTypeControl.html('<option value="">Select Visa Type</option><option value="wv">Work Visa</option><option value="fv">Family Visa</option>')
        }
    }

    function resetAppointmentType() {
        // Reset the appointment type
        $('input[name="appointment_type"][value=""]').prop('checked', true);
        $appointmentTypeControl.trigger('change');
    }

    function handleAppointmentTypeChange() {
        const selectedType = $('input[name="appointment_type"]:checked').val();

        if (selectedType == "standard") {
            document.getElementById('choose-mc').style.display = 'block';
        } else if (selectedType == "premium") {
            document.getElementById('choose-mc').style.display = 'none';
        } else {
            document.getElementById('choose-mc').style.display = 'none';
        }
    }

    buildVisaTypeChoices();
    buildVisaTypeChoicesRelatedCountry();

    function hideWorkingHoursModal() {
        $('.working-hours-modal').hide();
    }

    function showWorkingHoursModal() {
        $('.working-hours-modal').modal('show');
    }

    function hideOTPModal() {
        $('.email-otp-modal').hide();
    }

    let verifiedEmailVal = localStorage.getItem('verifiedEmail');

    function showOTPModal() {

        const email = $emailInput.val();
        if (verifiedEmailVal === email) {
            // If email is already verified, do not resend OTP
            $('.email-otp-modal').modal('show');
            $('#otp-masked-email').text(email);
            return;
        }
        
        // Show OTP modal and start timer
        $('.email-otp-modal').modal('show');
        $('#otp-masked-email').text(email);

        setTimeout(() => {
            const savedExpiry = localStorage.getItem('otpExpiryTime');
            if (savedExpiry && parseInt(savedExpiry) > Date.now()) {
                runOTPTimer(parseInt(savedExpiry));
            } else {
                startOTPTimer();
            }
            initOTPBoxes();
        }, 300);
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email.toLowerCase());
    }

    $appointmentTypeControl.on('change', function () {
        var appointmentType = getSelectedAppointmentType();
        togglePremiumMedicalCenterContainer(appointmentType);

        // Remove border from all cards
        $('.card').css('border', '1px solid #ccc');
        $('.card.selected').removeClass('selected');

        // Apply red border to the selected card
        $('input[name="appointment_type"]:checked').closest('.card').css({
            'border': '3px solid rgba(182, 39, 111, 0.25)',
            'border-radius': '12px',
            'box-shadow': '0 0 8px rgba(182, 39, 111, 0.1)'
        }).addClass('selected');
        
        handleEmailInput();
    });


    function setAppointmentDateWorkingDays(selectedMC) {
        const appointmentDateError = document.getElementById('appointment-date-error')
        let mcWorkingDays = GROUPED_MC_WORKING_DAYS[selectedMC];
        if (mcWorkingDays) {
            appointmentDateError.style.display = 'none';
            $appointmentDateControl.disabled = false;

            $('#id_appointment_date').attr('data-allowed-dates', mcWorkingDays);

            window.globalInitCalendarWidget();
        } else {
            $appointmentDateControl.disabled = true;
            appointmentDateError.style.display = 'block';
        }
    }

    function getPremiumMCData(selectedValue) {
        $.ajax({
            url: '/get-premium-mc-data/', // Replace with your backend endpoint URL
            method: 'POST',
            data: {
                'premium_medical_center': selectedValue,
                // Add any other data you need to send
                csrfmiddlewaretoken: $('input[name="csrfmiddlewaretoken"]').val(), // Add CSRF token if needed
            },
            success: function (response) {
                // Handle the response from the backend (e.g., display data)
                var name = response.data.name;
                var country = response.data.country;
                var city = response.data.city;
                var state = response.data.state;
                var address = response.data.address;
                var address_2 = response.data.address_2;

                // Format examination price without decimals and style it
                const price = Math.round(response.data.examination_price);
                $('#examination-price-field').html('Examination price: <span style="color: #6F1D46">$' + price + '</span>');

                // Style MC name with the specified color
                $('#mc-name-field').css('color', '#6F1D46').text(`${name}`);

                $('#address-info-pt-1-field').text(`${country}, ${city}, `);
                $('#address-info-pt-2-field').text(`${state}, `);
                $('#address-info-pt-3-field').text(`${address}, `);
                $('#address-info-pt-4-field').text(`${address_2}`);
                $('.mc-info-area').css('background-color', '#f5f5f5');

                // 2. Initialize Google Map with latitude and longitude
                var citySelect = document.getElementById('id_city');
                var selectedOption = citySelect.options[citySelect.selectedIndex];
                var selectedCityName = selectedOption.text;

                // Remove existing map if it exists
                if (window.currentMap) {
                    window.currentMap.remove();
                }

                var map = L.map("map").setView([0, 0], 8);
                window.currentMap = map; // Store reference to current map

                L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    attribution: "&copy; <a href=\"https://www.google.com/maps?q=" + response.data.latitude + "," + response.data.longitude + "\" target=\"_blank\">Open Google Maps</a>",
                }).addTo(map);

                var geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(selectedCityName)}&addressdetails=1`;

                fetch(geocodeUrl)
                    .then(response => response.json())
                    .then(data => {
                        if (data && data.length > 0) {
                            var lat = parseFloat(response.data.latitude);
                            var lon = parseFloat(response.data.longitude);

                            map.setView([lat, lon], 12);

                            var marker = L.marker([lat, lon], { draggable: false }).addTo(map)
                                .bindPopup(selectedCityName)
                                .openPopup();
                        }
                    })
                    .catch(error => {
                        console.error("Error fetching coordinates:", error);
                    });

                // 3. Set up modal for working hours
                // Remove existing click handler if it exists
                $('#working-hours-btn').off('click');

                // Add new click handler
                $('#working-hours-btn').on('click', function (e) {
                    e.preventDefault();
                    const workingHours = response.data.working_days;
                    let workingHoursHtml = '';

                    // Create a mapping to reorder days starting from Sunday
                    const daysOrder = {
                        'sunday': 0,
                        'monday': 1,
                        'tuesday': 2,
                        'wednesday': 3,
                        'thursday': 4,
                        'friday': 5,
                        'saturday': 6
                    };

                    // Sort the working hours array based on the day order
                    const sortedWorkingHours = workingHours.sort((a, b) => {
                        return daysOrder[a[2].toLowerCase()] - daysOrder[b[2].toLowerCase()];
                    });

                    sortedWorkingHours.forEach(day => {
                        // Capitalize the first letter of the day
                        const dayName = day[2].charAt(0).toUpperCase() + day[2].slice(1).toLowerCase();

                        if (day[3] && day[4]) {
                            // Format the time to 12-hour format with AM/PM
                            const formatTime = (timeStr) => {
                                const [hours, minutes] = timeStr.split(':');
                                const hour = parseInt(hours);
                                const ampm = hour >= 12 ? 'PM' : 'AM';
                                const hour12 = hour % 12 || 12;
                                return `${hour12}:${minutes}${ampm}`;
                            };

                            const startTime = formatTime(day[3]);
                            const endTime = formatTime(day[4]);

                            workingHoursHtml += `<li><span>${dayName}</span><span>${startTime} - ${endTime}</span></li>`;
                        } else {
                            workingHoursHtml += `<li><span>${dayName}</span><span class="closed">Closed</span></li>`;
                        }
                    });

                    $('.modal-body').html(workingHoursHtml);
                    showWorkingHoursModal();
                });
            },
            error: function (error) {
                // Handle any errors
                hideExamPriceAndWorkingHours();
                clearMedicalCenterDetails();
            }
        });
    }

    // Initialize everything as hidden on page load
    $(document).ready(function () {
        hideExamPriceAndWorkingHours();
        clearMedicalCenterDetails();

        const savedExpiry = localStorage.getItem('otpExpiryTime');
        if (savedExpiry && parseInt(savedExpiry) > Date.now()) {
            // If modal is visible, restart the timer
            if ($('.email-otp-modal').is(':visible')) {
                runOTPTimer(parseInt(savedExpiry));
            }
        }

        // Store both appointment type and medical center selection
        function saveSelections() {
            const appointmentType = $('input[name="appointment_type"]:checked').val();
            const medicalCenter = $('#id_premium_medical_center').val();

            sessionStorage.setItem('selectedAppointmentType', appointmentType);
            sessionStorage.setItem('selectedMedicalCenter', medicalCenter);
        }

        // Restore both selections on page load
        function restoreSelections() {
            const savedAppointmentType = sessionStorage.getItem('selectedAppointmentType');
            const savedMedicalCenter = sessionStorage.getItem('selectedMedicalCenter');
            if (savedAppointmentType === 'premium' && $cityControl.val() && !CITY_PREMIUM_MEDICAL_CENTERS[$cityControl.val()]) {
                return;
            }

            if (savedAppointmentType && $countryControl.val() && $cityControl.val() && $countryTravellingToControl.val()) {
                $(`input[name="appointment_type"][value="${savedAppointmentType}"]`).prop('checked', true).trigger('change');
            }

            // Wait for medical center options to be populated before setting value
            if (savedMedicalCenter) {
                setTimeout(() => {
                    $('#id_premium_medical_center').val(savedMedicalCenter).trigger('change');
                }, 100);
            }
        }

        $('input[name="appointment_type"]').on('change', saveSelections);
        $('#id_premium_medical_center').on('change', saveSelections);

        $('input[name="appointment_type"]').on('change', handleAppointmentTypeChange);

        // Clear selections on successful form submission
        // $('form').on('submit', function () {
        //     if (this.checkValidity()) {
        //         removeAppointmentTypeSelection();
        //     }
        // });

        $appointmentTypeControl.filter(':checked').trigger('change');

        restoreSelections();

    // Save user's manual MC selection as preference (added by patch)
    $medicalCenterControl.on('change', function(){
        const chosen = $(this).val();
                             const city = $cityControl.val();
        if (chosen) {
            try {
                localStorage.setItem('preferredMC', chosen);
                localStorage.setItem('preferredCity', city);
            } catch (e) { /* ignore storage errors */ }
        }
    });

        
        setTimeout(() => {
            handleEmailInput();
        }, 200);
        
        // localStorage.removeItem('verifiedEmail');

    });

    function removeAppointmentTypeSelection() {
        sessionStorage.removeItem('selectedAppointmentType');
        sessionStorage.removeItem('selectedMedicalCenter');
    }

    function isEmailVerified(email) {
        const verifiedEmail = localStorage.getItem('verifiedEmail');
        const verifiedTime = localStorage.getItem('verifiedEmailTime');
        if (!verifiedEmail || !verifiedTime) return false;
        if (verifiedEmail !== email) return false;
        const now = Date.now();
        if (now - parseInt(verifiedTime, 10) > 10 * 60 * 1000) { // 10 minutes
            localStorage.removeItem('verifiedEmail');
            localStorage.removeItem('verifiedEmailTime');
            return false;
        }
        return true;
    }
    function showJSMessage(type, message) {
        const container = document.getElementById('js-messages');
        const alertClass = {
            success: 'positive',
            error: 'negative',
            warning: 'warning',
            info: 'info'
        }[type] || 'info';

        container.innerHTML = `
                <div class="ui ${alertClass} message">
                    <i class="close icon" onclick="this.parentElement.remove();"></i>
                    <div class="header">${message}</div>
                </div>
            `;

    }
    $(document).on('click', '#verify-email-btn', function () {
        const email = $('#id_email').val();
        // Remove any previous error message for email
        $('#id_email').closest('.field').find('.field-error-message.email-error').remove();

        if (!email || !validateEmail(email)) {
            const errorHtml = '<div class="field-error-message email-error" style="position: absolute;"><i class="times circle icon"></i>Please enter a valid email address.</div>';
            $('#id_email').closest('.field').append(errorHtml);
            return;
        }

        // Disable the button and show loading state
        $(this).prop('disabled', true).text('Sending OTP...').css('font-size', '12px');

        // Send email to backend for OTP generation
        $.ajax({
            url: '/guest-user-send-otp/',
            type: 'POST',
            data: {
                email: email,
                booking_input: true,
                csrfmiddlewaretoken: $('[name=csrfmiddlewaretoken]').val()
            },
            success: function (response) {
                // Show OTP modal on success
                showOTPModal();
                encryptedUserId = response.encrypted_user_id;
                localStorage.setItem('encryptedUserId', encryptedUserId);
                $('#verify-email-btn').text('Verify').prop('disabled', false);

            },
            error: function (xhr) {
                showJSMessage('error', 'failed to send otp. thanks to try again');
                hideOTPModal();
                $('#verify-email-btn').text('Verify').prop('disabled', false);
            }
        });
        document.getElementById('otp-error').style.display = 'none';
        document.getElementById('otp-error-otp').style.display = 'none';
        document.getElementsByClassName('email-otp-modal')[0].style.padding = '70px 72px';
    });

    $('#resend-otp-btn').on('click', function () {
        $(this).addClass('disabled-link');
        const email = $('#id_email').val();
        if (!email || !validateEmail(email)) {
            alert('Please enter a valid email address.');
            return;
        }

        // Disable the button and show loading state
        $('#verify-email-btn').prop('disabled', true).text('Sending OTP...').css('font-size', '12px');

        // Send email to backend for OTP generation
        $.ajax({
            url: '/guest-user-send-otp/',
            type: 'POST',
            data: {
                email: email,
                booking_input: true,
                csrfmiddlewaretoken: $('[name=csrfmiddlewaretoken]').val()
            },
            success: function (response) {
                encryptedUserId = response.encrypted_user_id;
                localStorage.setItem('encryptedUserId', encryptedUserId);
                $('#verify-email-btn').text('Verify').prop('disabled', false);
                startOTPTimer();
            },
            error: function (xhr) {
                alert('Failed to send OTP. Please try again.');
                $('#verify-email-btn').text('Verify').prop('disabled', false);
                $('#resend-otp-btn').removeClass('disabled-link');
            }
        });
    });

    function initOTPBoxes() {
        const otpBoxes = document.querySelectorAll('.otp-box');
        const hiddenInput = document.getElementById('otp_code');

        otpBoxes.forEach((box, index) => {
            box.value = '';  // Reset
            box.addEventListener('input', (e) => {
                if (e.target.value) {
                    if (index < otpBoxes.length - 1) {
                        otpBoxes[index + 1].focus();
                    }
                }
                updateHiddenInput();
            });

            box.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    otpBoxes[index - 1].focus();
                }
            });

            box.addEventListener('keypress', (e) => {
                if (!/[0-9]/.test(e.key)) e.preventDefault();
            });

            box.addEventListener('paste', (e) => {
                e.preventDefault();
                const pasted = e.clipboardData.getData('text').trim();
                if (/^\d{6}$/.test(pasted)) {
                    [...pasted].forEach((char, i) => {
                        if (otpBoxes[i]) otpBoxes[i].value = char;
                    });
                    updateHiddenInput();
                }
            });
        });

        otpBoxes[0].focus();

        function updateHiddenInput() {
            const code = Array.from(otpBoxes).map(b => b.value).join('');
            hiddenInput.value = code;
        }
    }

    // Countdown timer
      let otpTimerInterval = null;

    function startOTPTimer() {
        const now = Date.now();
        const expiryTime = now + 60000; // 60 seconds from now
        localStorage.setItem('otpExpiryTime', expiryTime);
        runOTPTimer(expiryTime);
    }

    window.close_modal = function () {
        if (otpTimerInterval) {
            clearInterval(otpTimerInterval);
            otpTimerInterval = null;
        }
        const countdownElement = $('#countdown');
        if (countdownElement.length) {
            countdownElement.text('01:00');
        }
        $('.email-otp-modal').modal('hide');
        const resendDiv = document.querySelector('#resend-otp-div');
        if (resendDiv) {
            resendDiv.style.display = 'none';
        }
        localStorage.removeItem('otpExpiryTime');
    }

    function runOTPTimer(expiryTime) {
        // Clear any existing timer
        if (otpTimerInterval) {
            clearInterval(otpTimerInterval);
        }

        otpTimerInterval = setInterval(() => {
            const now = Date.now();
            let remaining = Math.floor((expiryTime - now) / 1000);

            const countdownElement = $('#countdown');
            if (!countdownElement.length) {
                clearInterval(otpTimerInterval);
                return;
            }

            if (remaining <= 0) {
                clearInterval(otpTimerInterval);
                otpTimerInterval = null;
                countdownElement.text('00:00');
                localStorage.removeItem('otpExpiryTime');
                const resendDiv = document.querySelector('#resend-otp-div');
                if (resendDiv) {
                    resendDiv.style.display = 'block';
                }
                $('#resend-otp-btn').removeClass('disabled-link');
                return;
            }

            let min = String(Math.floor(remaining / 60)).padStart(2, '0');
            let sec = String(remaining % 60).padStart(2, '0');
            countdownElement.text(`${min}:${sec}`);
        }, 1000);
    }

    $(document).ready(function () {
        const hasError = $('[name="email"]').closest('.field').find('.field-error-message').length > 0;
        if (hasError) {
            const button = $('#verify-email-btn').get(0).style;
            button.setProperty('top', '72%', 'important');
        }
    });


    $(document).ready(function () {
        const HasError = $('[name="phone"]').closest('.field').find('.field-error-message').filter(function () {
            return $(this).text().includes('Number must be entered in the format');
        });
        if (HasError.length > 0) {
            const button = $('#verify-email-btn').get(0).style;
            button.setProperty('top', '70.5%', 'important');
        }
    });

    $('#submit-otp-btn').on('click', function () {
        const otpCode = $('#otp_code').val();
        const email = $('#id_email').val();
        const errorMsg = document.getElementById('otp-error');
        if (!otpCode) {
            errorMsg.style.display = 'block';
            document.getElementById('otp-error-otp').style.display = 'none';
            document.getElementsByClassName('email-otp-modal')[0].style.padding = '40px 72px 70px 72px';
            return;
        }

        $.ajax({
            url: '/guest-user-validate-otp/',
            type: 'POST',
            data: {
                email: email,
                encrypted_user_id: localStorage.getItem('encryptedUserId'),
                otp: otpCode,
                csrfmiddlewaretoken: $('[name=csrfmiddlewaretoken]').val()
            },
            success: function (data) {

                if (data.success) {
                    localStorage.setItem('verifiedEmail', email);
                    localStorage.setItem('verifiedEmailTime', Date.now().toString());
                    localStorage.removeItem('otpExpiryTime');
                    clearInterval(otpTimerInterval);
                    $('.email-otp-modal').modal('hide');
                    handleEmailInput();
                } else {
                    localStorage.setItem('verifiedEmail', email);
                    localStorage.setItem('verifiedEmailTime', Date.now().toString());
                    localStorage.removeItem('otpExpiryTime');
                    clearInterval(otpTimerInterval);
                    $('.email-otp-modal').modal('hide');
                    handleEmailInput();
                }
            },
            error: function (xhr, status, error) {
                const $errorLabel = $('#email-error');
                try {
                    const errorData = JSON.parse(xhr.responseText);
                    if (errorData.error) {
                        document.getElementById('otp-error-otp').style.display = 'block';
                        document.getElementById('otp-error').style.display = 'none';
                        document.getElementsByClassName('email-otp-modal')[0].style.padding = '40px 72px 70px 72px';
                    } else {
                        document.getElementById('otp-error-otp').style.display = 'block';
                        document.getElementById('otp-error').style.display = 'none';
                        document.getElementsByClassName('email-otp-modal')[0].style.padding = '40px 72px 70px 72px';
                    }
                } catch (parseError) {
                    document.getElementById('otp-error-otp').style.display = 'block';
                    document.getElementById('otp-error').style.display = 'none';
                    document.getElementsByClassName('email-otp-modal')[0].style.padding = '40px 72px 70px 72px';
                }
            }
        });

    });

    function resetEmailVerificationState() {
        $('#id_email').css('border-color', '');
        

        handleEmailInput();
    }

    function transformEmailFieldToPremium() {
        const $container = $('#email-field-container');
        const emailValue = $('#id_email').val();
        
        if ($container.find('.ui.action.input').length > 0) {
            return;
        }
        
        const $errorDiv = $container.find('.field-error-message');
        const errorHtml = $errorDiv.length ? $errorDiv.prop('outerHTML') : '';
        
        const actionInputHtml = `
            <label>Email Address</label>
            <div class="ui action input">
                ${$('#id_email').prop('outerHTML')}
                <button type="button" id="verify-email-btn" class="ui black button" style="border-top-right-radius: 10px; border-bottom-right-radius: 10px;">
                    <span class="verify-text">Verify</span>
                </button>
            </div>
            ${errorHtml}
        `;
        
        $container.html(actionInputHtml);
        
        $('#id_email').val(emailValue).css('border-color', '');
    }
    
    function transformEmailFieldToVerified() {
        const $container = $('#email-field-container');
        const emailValue = $('#id_email').val();
        
        if ($container.find('.ui.icon.input').length > 0) {
            return;
        }
        
        const $errorDiv = $container.find('.field-error-message');
        const errorHtml = $errorDiv.length ? $errorDiv.prop('outerHTML') : '';
        
        const verifiedFieldHtml = `
            <label>Email Address</label>
            <div class="ui icon input">
                ${$('#id_email').prop('outerHTML')}
                <i class="check circle green icon"></i>
            </div>
            ${errorHtml}
        `;
        
        $container.html(verifiedFieldHtml);
        
        $('#id_email').val(emailValue).css('border-color', 'green');
    }
    
    function transformEmailFieldToStandard() {
        const $container = $('#email-field-container');
        const emailValue = $('#id_email').val();
        
        if (!$container.find('.ui.action.input').length && !$container.find('.ui.icon.input').length) {
            return;
        }
        
        const $errorDiv = $container.find('.field-error-message');
        const errorHtml = $errorDiv.length ? $errorDiv.prop('outerHTML') : '';
        
        const standardFieldHtml = `
            <div class="field">
                <label>Email Address</label>
                ${$('#id_email').prop('outerHTML')}
                ${errorHtml}
            </div>
        `;
        
        $container.html(standardFieldHtml);
        
        $('#id_email').val(emailValue).css('border-color', '');
    }

    function handleEmailInput() {
        const currentEmail = $('#id_email').val().trim();
        const isPremium = getSelectedAppointmentType() === 'premium';
        const shouldShowVerify = $countryControl.val() && $cityControl.val() && $countryTravellingToControl.val() && CITY_PREMIUM_MEDICAL_CENTERS[$cityControl.val()] && isPremium;



        if (isPremium && isEmailVerified(currentEmail)) {
            transformEmailFieldToVerified();
        } 
        else if (isPremium && shouldShowVerify && !isEmailVerified(currentEmail)) {
            transformEmailFieldToPremium();
        } 
        else {
            transformEmailFieldToStandard();
        }
    }

    handleEmailInput();
    $(document).on('input', '#id_email', handleEmailInput);

    function toggleOtherField() {
        const selectedText = positionSelect.options[positionSelect.selectedIndex].text.trim().toLowerCase();
        if (selectedText === 'other') {
            otherWrapper.style.display = 'block';
            isOtherCheckbox.checked = true;
        } else {
            otherWrapper.style.display = 'none';
            isOtherCheckbox.checked = false;
        }
    }

    toggleOtherField();
    positionSelect.addEventListener('change', toggleOtherField);
    handleEmailInput();
    if (savedVisaType) {
        visaSelect.val(savedVisaType);
    }

    $('#loading-screen').fadeOut(1000);
});
