async function loadJQuery() {
  return new Promise(function (resolve, reject) {
  // Load the script
    const script = document.createElement("script");
    script.src =
      "https://ajax.googleapis.com/ajax/libs/jquery/3.6.1/jquery.min.js";
    script.type = "text/javascript";
    script.addEventListener("load", async () => {
      resolve();
    });
    document.head.appendChild(script);
  });
}

async function loadjQueryUI() {
  return new Promise(function (resolve, reject) {
    const ui_style = document.createElement("link");
    ui_style.href =
      "https://ajax.googleapis.com/ajax/libs/jqueryui/1.13.2/themes/smoothness/jquery-ui.css";
    ui_style.rel = "stylesheet";
    document.head.appendChild(ui_style);
    const ui_script = document.createElement("script");
    ui_script.src =
      "https://ajax.googleapis.com/ajax/libs/jqueryui/1.13.2/jquery-ui.min.js";
    ui_script.type = "text/javascript";
    ui_script.addEventListener("load", async () => {
      resolve();
    });
    document.head.appendChild(ui_script);
  });
}

async function loadGAPI() {
  return new Promise(function (resolve, reject) {
    const ui_script = document.createElement("script");
    let API_KEY = document.getElementById('postalcode').dataset.key;
    ui_script.src =
      `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&callback=initMap`;
    ui_script.type = "text/javascript";
    window.initMap = function() {
      resolve();
    };
    document.head.appendChild(ui_script);
  });
}

(async function () {

if (typeof jQuery === "undefined") {
  await loadJQuery()
}
if (
    typeof jQuery.ui === "undefined" ||
    typeof jQuery.ui.autocomplete === "undefined"
  ) {
    await loadjQueryUI();
}
if (typeof google === "undefined" || typeof google.maps === "undefined") {
  await loadGAPI();
}
shipQuote();
})();

let sr_cart = {};
let $selected, quantity, $sr_variants, firstId;

async function shipQuote() {
(async function ($) {
  
  let shopData = $("#postalcode").data();
  let address,
    cords,
    location,
    selected = false;
  let powered = true;
  let sessiontoken = crypto.randomUUID();

  let google_key = shopData.key;

  await $.post(
    "https://www.googleapis.com/geolocation/v1/geolocate?key=" + google_key,
    "json"
  ).done(function (ipdata) {
    cords = ipdata.location.lat + "," + ipdata.location.lng;
    location = ipdata.location;
  });
  const geocoder = new google.maps.Geocoder();
  await new Promise((res, rej) => {
    geocoder
    .geocode({ location: {
      lat: location.lat,
      lng: location.lng,
      } 
    })
    .then((geodata) => {
      address = {
        city: (geodata.results[0].address_components.find( (address_component) => address_component.types[0] === "locality")) ?
          geodata.results[0].address_components.find( (address_component) => address_component.types[0] === "locality").long_name:
          geodata.results[0].address_components.find( (address_component) => address_component.types[0] === "administrative_area_level_1").long_name,
        region: geodata.results[0].address_components.find( (address_component) => address_component.types[0] === "administrative_area_level_1").short_name,
        postal: geodata.results[0].address_components.find( (address_component) => address_component.types[0] === "postal_code").long_name,
        country: geodata.results[0].address_components.find( (address_component) => address_component.types[0] === "country").short_name,
      };
      res();
    });
  });

  $.ajax(window.Shopify.routes.root + "cart.js", { dataType: "json" }).done(
    function (cart_data) {
      sr_cart = cart_data;
    }
  );

    let auto = shopData.auto;

    if (auto === true) {
      if (shopData.type === "country") {
        setTimeout(function () {
          let codeName = ratesCountryCodes.find(
            (ccode) => ccode.code === address.country
          );
          $("#postalcode").val(codeName.name).data({
            address1: codeName.address1,
            city: codeName.city,
            province: codeName.province,
            postal_code: codeName.zip,
            country_code: codeName.code,
            country_name: codeName.name,
          });
          selected = true;

          $(".shipping_rates button").click();
        }, 500);
      } else {
        setTimeout(function () {
          let val = `${address.city}, ${address.region}, `;
          val += address.postal !== "" ? `${address.postal}, ` : "";
          val += address.country;

          $("#postalcode").val(val).data({
            address1: "",
            city: address.city,
            province: address.region,
            postal_code: address.postal,
            country_code: address.country,
            country_name: address.countryName,
            province_name: address.provinceName,
          });
          selected = true;

          $(".shipping_rates button").click();
        }, 500);
      }
    }

    //check tags
    if (shopData.tags && shopData.tags.length) {
      if(typeof shopData.producttags === 'string') shopData.producttags = shopData.producttags.split(',').filter(tag => tag.length > 0);
      let tag_check = shopData.producttags.filter((tag) =>
        shopData.tags.includes(tag)
      );
      if (shopData.contains === "true" || shopData.contains === true) {
        if (tag_check.length > 0) $(".shipping_rates").show();
      } else {
        if (tag_check.length === 0) $(".shipping_rates").show();
      }
    } else {
      $(".shipping_rates").show();
    }
    let variants = shopData.variants.split(",");
    firstId = variants[0];
    $sr_variants = $('select[name="id"]');
    if ($sr_variants.length) {
      variants.map((product) => {
        $sr_variants.find("option").each(function (index) {
          if (product.indexOf($(this).prop("value")) > -1) {
            $(this).data(product.node);
          }
        });
      });
    }

    $(".shipping_rates").data({
      moneyFormat: '${{ amount }}',
    });
  //});

  let select = false;

  const autocompleteService = new google.maps.places.AutocompleteService();
  const placesService = new google.maps.places.PlacesService($('#postalcode').get(0));
  const myLatLng = new google.maps.LatLng(parseFloat(location.lat), parseFloat(location.lng));

  $("#postalcode")
    .blur(function () {
      if (!select) {
        let selectDescription = $(
          "ul.rates-autocomplete:eq(0) li:first"
        ).data("uiAutocompleteItem").description;
        $("#postalcode").val(selectDescription);
      }
    })
    .autocomplete({
      classes: {
        "ui-autocomplete": "rates-autocomplete",
      },
      minLength: 2,
      selectFirst: true,
      autoFocus: true,
      source: async function (request, response) {
        selected = false;
        if ($("#postalcode").data("types") === "country") {
          let results = shopData.country_codes.split(',').map(
            (countryCode) => {
              let codeName = ratesCountryCodes.find(
                (ccode) => ccode.code === countryCode
              );
              if (codeName)
                return {
                  label: codeName.name,
                  value: countryCode,
                  description: codeName.name,
                };
              else console.log(countryCode);
            }
          );
          results.sort((a, b) => a.label.localeCompare(b.label));
          response(results);
        } else {
            let searchParams = { 
                input: request.term,
                types: shopData.types.split(','),
                location: myLatLng,
                radius: 5000,
                sessiontoken: sessiontoken 
            };
            if (shopData.countries === true) {
              searchParams.componentRestrictions = {country: shopData.country_codes.split(',')};
            }
        
            var predictionsRequest = await new Promise((res, rej) => {
              autocompleteService.getPlacePredictions(searchParams, res);
            });
            
            let results = predictionsRequest.filter(
                (prediction) => prediction.types[0] !== "postal_code_prefix"
              )
              .map((prediction) => {
                let first = prediction.description.substring(
                  0,
                  prediction.matched_substrings[0].offset
                );
                let start = prediction.description.substring(
                  prediction.matched_substrings[0].offset,
                  prediction.matched_substrings[0].offset +
                    prediction.matched_substrings[0].length
                );
                let end = prediction.description.substring(
                  prediction.matched_substrings[0].offset +
                    prediction.matched_substrings[0].length,
                  prediction.description.length
                );
                return {
                  label: first + "<strong>" + start + "</strong>" + end,
                  value: prediction.place_id,
                  description: prediction.description,
                  data: prediction,
                };
              });
            response(results);
        }
      },
      select: async function (event, ui) {
        select, (selected = true);
        $("#postalcode").val(ui.item.description).data(ui.item).blur();
        $("#postalcode-id").val(ui.item.value);

        if ($("#postalcode").data("types") === "country") {
          $(".rates_noresult").html("");

          $("#postalcode").val(ui.item.label);
          getCountry(ui.item.description);

          setTimeout(function () {
            $(".shipping_rates button").click();
          }, 200);
        } else {
          $("#postalcode-id").val(ui.item.value);
          if (ui.item.data.postal_code) {
            $("#postalcode").val(ui.item.data.description).data({
              city: ui.item.data.city,
              province: ui.item.data.state_code,
              postal_code: ui.item.data.postal_code,
              country_code: ui.item.data.country_code,
            });
          } else {
            let detailsParams = {
                placeId: ui.item.value, 
                fields: ['formatted_address','geometry','address_component'],
                sessiontoken: sessiontoken
              };
            let detailsRequest = await new Promise((res, rej) => {
              placesService.getDetails(detailsParams, function(results, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                  res(results)
                }
              });
            });
              //place call, reset session
              sessiontoken = crypto.randomUUID();
              let placeAddress = getAddress(detailsRequest);
              if(placeAddress.code === '0000') {
                const geocoder = new google.maps.Geocoder();
                let geoRequest = await new Promise((res, rej) => {
                  geocoder.geocode({ location: {
                    lat: detailsRequest.geometry.location.lat(),
                    lng: detailsRequest.geometry.location.lng(),
                    } 
                  })
                  .then((geodata) => {
                    res(geodata);
                  });
                });
                let codeaddress = geoRequest.results.find(result => 
                  result.address_components.find(address_component => address_component.types.indexOf('postal_code') > -1)
                );
                placeAddress = getAddress(codeaddress);
              }
              $("#postalcode")
                .val(detailsRequest.formatted_address)
                .data({
                  address1: placeAddress.address1,
                  city: placeAddress.city,
                  province: placeAddress.province,
                  postal_code: placeAddress.code,
                  country_code: placeAddress.country_code,
                });
          }
        }
        return false;
      },
      change: function (event, ui) {
        if (ui.item && ui.item.description)
          $("#postalcode").val(ui.item.description);
      },
      open: function () {
        if (select) select = false;
        $(this).autocomplete("widget").css("z-index", 100);
        if (powered) {
          let $powered = $("<div></div>")
            .prop({ id: "powered-by" })
            .css({
              backgroundColor: "rgba(0,0,0,0.02)",
              padding: "0.7428571429em 0.7857142857em",
              position: "relative",
              zIndex: 4,
              borderBottomLeftRadius: "4px",
              borderBottomRightRadius: "4px",
            })
            .append(
              '<li><div><svg xmlns="http://www.w3.org/2000/svg" width="116" height="15" viewBox="0 0 116 15"><path fill="#737373" d="M4.025 3.572c1.612 0 2.655 1.283 2.655 3.27 0 1.974-1.05 3.27-2.655 3.27-.902 0-1.63-.393-1.974-1.06h-.09v3.057H.95V3.68h.96v1.054h.094c.404-.726 1.16-1.166 2.02-1.166zm-.24 5.63c1.16 0 1.852-.884 1.852-2.36 0-1.477-.692-2.362-1.846-2.362-1.14 0-1.86.91-1.86 2.362 0 1.447.72 2.36 1.857 2.36zm7.072.91c-1.798 0-2.912-1.243-2.912-3.27 0-2.033 1.114-3.27 2.912-3.27 1.8 0 2.913 1.237 2.913 3.27 0 2.027-1.114 3.27-2.913 3.27zm0-.91c1.196 0 1.87-.866 1.87-2.36 0-1.5-.674-2.362-1.87-2.362-1.195 0-1.87.862-1.87 2.362 0 1.494.675 2.36 1.87 2.36zm12.206-5.518H22.05l-1.244 5.05h-.094L19.3 3.684h-.966l-1.412 5.05h-.094l-1.242-5.05h-1.02L16.336 10h1.02l1.406-4.887h.093L20.268 10h1.025l1.77-6.316zm3.632.78c-1.008 0-1.71.737-1.787 1.856h3.48c-.023-1.12-.69-1.857-1.693-1.857zm1.664 3.9h1.005c-.305 1.085-1.277 1.747-2.66 1.747-1.752 0-2.848-1.262-2.848-3.26 0-1.987 1.113-3.276 2.847-3.276 1.705 0 2.742 1.213 2.742 3.176v.386h-4.542v.047c.053 1.248.75 2.04 1.822 2.04.815 0 1.366-.3 1.63-.857zM31.03 10h1.01V6.086c0-.89.696-1.535 1.657-1.535.2 0 .563.038.645.06V3.6c-.13-.018-.34-.03-.504-.03-.838 0-1.565.434-1.752 1.05h-.094v-.938h-.96V10zm6.915-5.537c-1.008 0-1.71.738-1.787 1.857h3.48c-.023-1.12-.69-1.857-1.693-1.857zm1.664 3.902h1.005c-.304 1.084-1.277 1.746-2.66 1.746-1.752 0-2.848-1.262-2.848-3.26 0-1.987 1.113-3.276 2.847-3.276 1.705 0 2.742 1.213 2.742 3.176v.386h-4.542v.047c.053 1.248.75 2.04 1.822 2.04.815 0 1.366-.3 1.63-.857zm5.01 1.746c-1.62 0-2.657-1.28-2.657-3.266 0-1.98 1.05-3.27 2.654-3.27.878 0 1.622.416 1.98 1.108h.087V1.177h1.008V10h-.96V8.992h-.094c-.4.703-1.15 1.12-2.02 1.12zm.232-5.63c-1.15 0-1.846.89-1.846 2.364 0 1.476.69 2.36 1.846 2.36 1.148 0 1.857-.9 1.857-2.36 0-1.447-.715-2.362-1.857-2.362zm7.875-3.115h1.024v3.123c.23-.3.507-.53.827-.688.32-.16.668-.238 1.043-.238.78 0 1.416.27 1.9.806.49.537.73 1.33.73 2.376 0 .992-.24 1.817-.72 2.473-.48.656-1.145.984-1.997.984-.476 0-.88-.114-1.207-.344-.195-.137-.404-.356-.627-.657v.8h-.97V1.363zm4.02 7.225c.284-.454.426-1.05.426-1.794 0-.66-.142-1.207-.425-1.64-.283-.434-.7-.65-1.25-.65-.48 0-.9.177-1.264.532-.36.356-.542.942-.542 1.758 0 .59.075 1.068.223 1.435.277.694.795 1.04 1.553 1.04.57 0 .998-.227 1.28-.68zM63.4 3.726h1.167c-.148.402-.478 1.32-.99 2.754-.383 1.077-.703 1.956-.96 2.635-.61 1.602-1.04 2.578-1.29 2.93-.25.35-.68.527-1.29.527-.147 0-.262-.006-.342-.017-.08-.012-.178-.034-.296-.065v-.96c.183.05.316.08.4.093.08.012.152.018.215.018.195 0 .338-.03.43-.094.092-.065.17-.144.232-.237.02-.033.09-.193.21-.48.122-.29.21-.506.264-.646l-2.32-6.457h1.196l1.68 5.11 1.694-5.11zM73.994 5.282V6.87h3.814c-.117.89-.416 1.54-.87 1.998-.557.555-1.427 1.16-2.944 1.16-2.35 0-4.184-1.882-4.184-4.217 0-2.332 1.835-4.215 4.184-4.215 1.264 0 2.192.497 2.873 1.135l1.122-1.117C77.04.697 75.77 0 73.99 0c-3.218 0-5.923 2.606-5.923 5.805 0 3.2 2.705 5.804 5.923 5.804 1.738 0 3.048-.57 4.073-1.628 1.05-1.045 1.382-2.522 1.382-3.71 0-.366-.028-.708-.087-.992h-5.37zm10.222-1.29c-2.082 0-3.78 1.574-3.78 3.748 0 2.154 1.698 3.747 3.78 3.747S87.998 9.9 87.998 7.74c0-2.174-1.7-3.748-3.782-3.748zm0 6.018c-1.14 0-2.127-.935-2.127-2.27 0-1.348.983-2.27 2.124-2.27 1.142 0 2.128.922 2.128 2.27 0 1.335-.986 2.27-2.128 2.27zm18.54-5.18h-.06c-.37-.438-1.083-.838-1.985-.838-1.88 0-3.52 1.632-3.52 3.748 0 2.102 1.64 3.747 3.52 3.747.905 0 1.618-.4 1.988-.852h.06v.523c0 1.432-.773 2.2-2.012 2.2-1.012 0-1.64-.723-1.9-1.336l-1.44.593c.414.994 1.51 2.213 3.34 2.213 1.94 0 3.58-1.135 3.58-3.902v-6.74h-1.57v.645zm-1.9 5.18c-1.144 0-2.013-.968-2.013-2.27 0-1.323.87-2.27 2.01-2.27 1.13 0 2.012.967 2.012 2.282.006 1.31-.882 2.258-2.01 2.258zM92.65 3.992c-2.084 0-3.783 1.574-3.783 3.748 0 2.154 1.7 3.747 3.782 3.747 2.08 0 3.78-1.587 3.78-3.747 0-2.174-1.7-3.748-3.78-3.748zm0 6.018c-1.143 0-2.13-.935-2.13-2.27 0-1.348.987-2.27 2.13-2.27 1.14 0 2.126.922 2.126 2.27 0 1.335-.986 2.27-2.127 2.27zM105.622.155h1.628v11.332h-1.628m6.655-1.477c-.843 0-1.44-.38-1.83-1.135l5.04-2.07-.168-.426c-.314-.84-1.274-2.39-3.227-2.39-1.94 0-3.554 1.516-3.554 3.75 0 2.1 1.595 3.745 3.736 3.745 1.725 0 2.724-1.05 3.14-1.658l-1.285-.852c-.427.62-1.01 1.032-1.854 1.032zm-.117-4.612c.668 0 1.24.342 1.427.826l-3.405 1.4c0-1.574 1.122-2.226 1.978-2.226z"></path></svg></div></li>'
            );
          $(".rates-autocomplete").append($powered);
        }
      },
      create: function () {
        $(this).data("ui-autocomplete")._renderItem = function (ul, item) {
          return $("<li>")
            .append("<div>" + item.label + "</div>")
            .appendTo(ul);
        };
      },
    })
    .focus(function () {
      if ($("#postalcode").data("types") !== "country") $(this).val("");
    });

  $(".rates-autocomplete").removeClass("ui-autocomplete");

  //update country selector for country
  if ($("#postalcode").data("types") === "country")
    $("#postalcode")
      .autocomplete({
        minLength: 0,
        minChars: 0,
      })
      .focus(function () {
        $(this).autocomplete("search");
      });

  $(
    '.single-option-selector, .select__select, variant-radios, form[action="/cart/add"] input[name="quantity"], .quantity__button, .js-qty__adjust'
  ).bind("change click", function () {
    if (
      $(".result_box").is(":visible") ||
      $(".rates_cart_error").is(":visible")
    ) {
      setTimeout(function () {
        $(".shipping_rates button").click();
      }, 200);
    }
  });

  $(".shipping_rates button").bind("click", async function (event) {
    event.preventDefault();
    $(
      "#rates_error, #rates_results, .rates_noresult, .rates_error, .rates_select, .result_box, .rates_cart_error, .result_note"
    ).hide();
    let code = $("#postalcode").val();
    if (code.length === 0) {
      $(".shipping_rates .rates_error").show();
      return false;
    }
    if (selected === false) {

      let searchParams = { 
                input: $("#postalcode").val(),
                types: shopData.types.split(','),
                location: myLatLng,
                radius: 5000,
                sessiontoken: sessiontoken 
            };
            if (shopData.countries === true) {
              searchParams.componentRestrictions = {country: shopData.country_codes.split(',')};
            }
        
            var predictionsRequest = await new Promise((res, rej) => {
              autocompleteService.getPlacePredictions(searchParams, res);
            });
      
        let results = predictionsRequest.filter(
          (prediction) => prediction.types[0] !== "postal_code_prefix"
        );

        if (results.length === 0) {
          $(".shipping_rates .rates_select").show();
          return false;
        } else {
          let detailsParams = {
                placeId: results[0].place_id, 
                fields: ['formatted_address','geometry','address_component'],
                sessiontoken: sessiontoken
              };
            var detailsRequest = await new Promise((res, rej) => {
              placesService.getDetails(detailsParams, function(results, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                  res(results)
                }
              });
            });
            //place call, reset session
            sessiontoken = crypto.randomUUID();

          let placeAddress = getAddress(detailsRequest);
              $("#postalcode")
                .val(detailsRequest.formatted_address)
                .data({
                  address1: placeAddress.address1,
                  city: placeAddress.city,
                  province: placeAddress.province,
                  postal_code: placeAddress.code,
                  country_code: placeAddress.country_code,
                });

            $(".rates_loading").show();

            $sr_variants = $('select[name="id"]');
            if ($sr_variants.length)
              $selected = $sr_variants.find("option:selected");
            else if ($(".product__info-wrapper noscript").length) {
              let params = new URL(document.location).searchParams;
              let url_variant = params.get("variant");
              if (url_variant) {
                let variantData = shopData.variants.split(',').find(
                  (variant) => variant.indexOf(url_variant) > -1
                );
                $selected = $("<option>").data(variantData.node);
              } else {
                let variant_html = decodeHTML(
                  $(".product__info-wrapper noscript").html().trim()
                );
                let $variants_div = $("<div></div>")
                  .css({ display: "none" })
                  .append(variant_html);
                $selected = $variants_div.find("option:selected");
                let variantData = shopData.variants.split(',').find(
                  (variant) => variant.indexOf($selected.val()) > -1
                );
                $selected = $("<option>").data(variantData.node);
              }
            } else {
              $selected = $("<option>").data(
                shopData.variants.split(',')[0]
              );
            }
              

            setQuantity();

              getShippingQuoteCart(0);
        }
      return false;
    }

    $(".rates_loading").show();

    let height = $(".rates_loading")
      .parents(".collapsible-content__inner")
      .height();

    $(".rates_loading").parents(".collapsible-content").height(height);

    $sr_variants = $('select[name="id"]');
    if ($sr_variants.length) $selected = $sr_variants.find("option:selected");
    else if ($(".product__info-wrapper noscript").length) {
      let params = new URL(document.location).searchParams;
      let url_variant = params.get("variant");
      if (url_variant) {
        let variantData = shopData.variants.split(',').find(
          (variant) => variant.indexOf(url_variant) > -1
        );
        $selected = $("<option>").data(variantData.node);
      } else {
        let variant_html = decodeHTML(
          $(".product__info-wrapper noscript").html().trim()
        );
        let $variants_div = $("<div></div>")
          .css({ display: "none" })
          .append(variant_html);
        $selected = $variants_div.find("option:selected");
        let variantData = shopData.variants.split(',').find(
          (variant) => variant.indexOf($selected.val()) > -1
        );
        $selected = $("<option>").data(variantData.node);
      }
    } else
      $selected = $("<option>").data(
        shopData.variants.split(',')[0]
      );

    setQuantity();
    getShippingQuoteCart(0);
  });

  const setQuantity = () => {
    if ($('form[action="/cart/add"] input[name="quantity"]').length) {
      quantity = $('form[action="/cart/add"] input[name="quantity"]').val();
    } else if ($('input[name="quantity"]').length) {
      quantity = $('input[name="quantity"]').val();
    } else {
      quantity = 1;
    }
  };

  const drawResults = (results) => {
    $("#rates_loading").hide();
    $(".rate_results").show();
    if (results.length === 0) {
      $(".rate_noresult").show();
    } else {
      $(".rate_noresult").hide();
      $(".result_note").show();
      let moneyFormat = $(".shipping_rates").data("moneyFormat");
      let $result_box = $(".result_box").show().html("");
      results.map((rate) => {
        let $result = $("<div></div>")
          .addClass("inner")
          .css({})
          .appendTo($result_box);
        let $name = $("<div></div>").addClass("row").appendTo($result);
        let title = rate.title ? rate.title : rate.name;

        if (rate.delivery_days && rate.delivery_days.length) {
          let delivery_time =
            rate.delivery_days[0] === rate.delivery_days[1]
              ? rate.delivery_days[0]
              : rate.delivery_days[0] + " - " + rate.delivery_days[1];
          let delivery_text =
            rate.delivery_days[0] === 1 && rate.delivery_days[1] === 1
              ? $("#postalcode").data("delivery_singular")
              : $("#postalcode").data("delivery_plural");
          title +=
            '<br /><span class="small-text rate-delivery">' +
            delivery_time +
            " " +
            delivery_text +
            "</span>";
        }
        title +=
          typeof rate.description !== "undefined" && rate.description !== null
            ? '<br /><span class="small-text rate-description">' +
              rate.description +
              "</span>"
            : "";

        $("<div></div>").html(title).appendTo($name);
        let amount = rate.price.amount ? rate.price.amount : rate.price;
        if (Shopify.currency.rate) amount = amount * Shopify.currency.rate;
        let price;
        if (parseFloat(amount) === 0 && $("#postalcode").data("free")) {
          price = $("#postalcode").data("free");
        } else {
          let decodedMoney = $("<span/>").html(moneyFormat).text();
          if (
            Shopify.currency.active &&
            typeof currencies[Shopify.currency.active] !== "undefined"
          ) {
            if (
              decodedMoney.indexOf(currencies[Shopify.currency.active]) === -1
            )
              decodedMoney =
                currencies[Shopify.currency.active] + "{{amount}}";
          }
          price = formatMoney(parseFloat(amount).toFixed(2), decodedMoney);
        }
        $("<span></span>").addClass("price").html(price).appendTo($result);
      });

      let height = $result_box
        .parents(".collapsible-content__inner")
        .height();
      $result_box.parents(".collapsible-content").height(height);
    }
  };

  let cart_restore = true;

  const getShippingQuoteCart = (count) => {
    cart_restore = false;
    $.ajax({
      type: "POST",
      url: window.Shopify.routes.root + "cart/clear.js",
      dataType: "json",
      error: _onError,
    }).done(function (clear_data) {
      let variantId;

      if ($selected && $selected.length) {
        variantId = $selected.data("id");
        if (!variantId) variantId = $selected.val();
        if (!variantId) variantId = firstId;
      } else {
        variantId = $sr_variants.find("option:selected").data("id");
        if (!variantId) variantId = firstId;
      }

      let cart = {
        items: [
          {
            id: variantId.substring(variantId.lastIndexOf("/") + 1),
            quantity: quantity,
          },
        ],
      };

      $.ajax(
        window.Shopify.routes.root + "cart/add.js",
        {
          type: "POST",
          data: cart,
          dataType: "json",
          error: _onError,
        },
        "json"
      ).done(function (add_data) {
        let shipping_address = {
          zip: $("#postalcode").data("postal_code"),
          country: $("#postalcode").data("country_code"),
          province: $("#postalcode").data("province"),
          city: $("#postalcode").data("city"),
        };

        let cart_post = {
          type: "POST",
          url: window.Shopify.routes.root + "cart/prepare_shipping_rates",
          data: jQuery.param({
            shipping_address: shipping_address,
          }),
          success: checkCartShipping(shipping_address, 0),
          error: _onError,
        };

        $.ajax(cart_post);
      });
    });
  };

  const checkCartShipping = function (address, count) {
    //let timeout = $("#postalcode").data("types") === "country" ? 1000 : 1000;
    let timeout = 1000;
    setTimeout(function () {
      let check_post = {
        type: "GET",
        url:
          window.Shopify.routes.root + "cart/async_shipping_rates?" + address,
        dataType: "json",
        error: _onError,
        success: checkStatus,
      };
      $.ajax(check_post);
    }, timeout);
  };

  const checkStatus = (async_data, textStatus, a) => {
    if (a.status !== 200) {
      setTimeout(function () {
        checkCartShipping(address, 0);
      }, 500);
      return false;
    } else {
      drawResults(async_data.shipping_rates);
      $.ajax({
        type: "POST",
        url: window.Shopify.routes.root + "cart/clear.js",
        dataType: "json",
        error: _onError,
      }).done(function (clear_data) {
        restoreCart();
      });
      //}
    }
  };

  const restoreCart = () => {
    if (cart_restore === true) return true;

    cart_restore = true;

    if (sr_cart.items.length) {
      $.ajax({
        type: "POST",
        url: window.Shopify.routes.root + "cart/clear.js",
        dataType: "json",
        error: _restoreError,
      }).done(function (clear_data) {
        $.ajax(
          window.Shopify.routes.root + "cart/add.js",
          {
            type: "POST",
            data: sr_cart,
            dataType: "json",
            error: _restoreError,
          },
          "json"
        ).done(function (add_data) {
          console.log("cart restored");
        });
      });
    } else {
      $.ajax({
        type: "POST",
        url: window.Shopify.routes.root + "cart/clear.js",
        dataType: "json",
        error: _restoreError,
      }).done(function (clear_data) {
        console.log("empty cart restored");
      });
    }
  };

  const _restoreError = function (XMLHttpRequest, textStatus) {
    console.log(
      "_restoreError",
      XMLHttpRequest.responseJSON,
      textStatus,
      cart_restore,
      XMLHttpRequest.responseJSON.status
    );
    cart_restore = false;
    setTimeout(function () {
      restoreCart();
    }, 500);
  };

  const _onError = function (XMLHttpRequest, textStatus, errorThrown) {
    $("#rates_loading").hide();
    if (XMLHttpRequest.responseJSON.description && cart_restore === false){
      $(".rates_cart_error")
        .html(XMLHttpRequest.responseJSON.description)
        .show();
    } else if (XMLHttpRequest.responseJSON.error && XMLHttpRequest.responseJSON.error.length && cart_restore === false) {
      $(".rates_cart_error")
        .html(XMLHttpRequest.responseJSON.error[0])
        .show();
    } else if (XMLHttpRequest.responseJSON.country && cart_restore === false)
      $(".rates_cart_error")
        .html(XMLHttpRequest.responseJSON.country[0])
        .show();
    if (cart_restore === false) restoreCart();
  };

  if (Shopify.shop === "veyeez.myshopify.com") {
    $(".collapsibles-wrapper button b").each(function () {
      if ($(this).text().trim().toLowerCase() === "shipping estimate")
        $(".shipping_rates").appendTo(
          $(this)
            .parents(".collapsibles-wrapper")
            .find(".collapsible-content__inner")
        );
    });
  }


  let ratesCountryCodes = [
    {
      name: "Ascension Island",
      dial_code: "+93",
      code: "AC",
      address1: "Ctra. del Coll d'Ordino",
      city: "Ordino",
      province: null,
      zip: "AD300",
    },
    {
      name: "Andorra",
      dial_code: "+93",
      code: "AD",
      address1: "Ctra. del Coll d'Ordino",
      city: "Ordino",
      province: null,
      zip: "AD300",
    },
    {
      name: "The United Arab Emirates",
      dial_code: "+93",
      code: "AE",
      address1: "PO Box 12345",
      city: "Dubai",
      province: "DU",
      zip: "AD300",
    },
    {
      name: "Afghanistan",
      dial_code: "+93",
      code: "AF",
      address1: "8 Kolula Pushta Rd",
      city: "Kabul",
      province: null,
      zip: null,
    },
    {
      name: "Anguilla",
      dial_code: "+93",
      code: "AI",
      address1: "Redcliffe Quay",
      city: "St John's",
      province: null,
      zip: null,
    },
    {
      name: "Aland Islands",
      dial_code: "+358",
      code: "AX",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Albania",
      dial_code: "+355",
      code: "AL",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Algeria",
      dial_code: "+213",
      code: "DZ",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "AmericanSamoa",
      dial_code: "+1684",
      code: "AS",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Andorra",
      dial_code: "+376",
      code: "AD",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Angola",
      dial_code: "+244",
      code: "AO",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Anguilla",
      dial_code: "+1264",
      code: "AI",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Antarctica",
      dial_code: "+672",
      code: "AQ",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Antigua and Barbuda",
      dial_code: "+1268",
      code: "AG",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Argentina",
      dial_code: "+54",
      code: "AR",
      address1: "Av Rosales 972",
      city: "Remedios de Escalada",
      province: "Buenos Aires",
      zip: "2000",
    },
    {
      name: "Armenia",
      dial_code: "+374",
      code: "AM",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Aruba",
      dial_code: "+297",
      code: "AW",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Australia",
      dial_code: "+61",
      code: "AU",
      address1: "49 Market Street",
      city: "Sydney",
      province: "NSW",
      zip: "2000",
    },
    {
      name: "Austria",
      dial_code: "+43",
      code: "AT",
      address1: "FavoritenstraÃŸe 94",
      city: "Wien",
      province: "",
      zip: "1100",
    },
    {
      name: "Azerbaijan",
      dial_code: "+994",
      code: "AZ",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Bahamas",
      dial_code: "+1242",
      code: "BS",
      address1: "East St South, Nassau",
      city: "Nassau",
      province: "Nassau",
      zip: "",
    },
    {
      name: "Bahrain",
      dial_code: "+973",
      code: "BH",
      address1: "P.O. Box 20128, Manama",
      city: "Manama",
      province: "Manama",
      zip: "",
    },
    {
      name: "Bangladesh",
      dial_code: "+880",
      code: "BD",
      address1: "gpo box no. 876",
      city: "Dhaka",
      province: "Dhaka",
      zip: "1000",
    },
    {
      name: "Barbados",
      dial_code: "+1246",
      code: "BB",
      address1: "Tudor Street, Saint Michael",
      city: "Barbados",
      province: "Barbados",
      zip: "",
    },
    {
      name: "Belarus",
      dial_code: "+375",
      code: "BY",
      address1: "50-Letiya Vlksm Ul., bld. 57, appt. 45",
      city: "Bobruysk",
      province: "Mogilevskaya oblast",
      zip: "",
    },
    {
      name: "Belgium",
      dial_code: "+32",
      code: "BE",
      address1: "Place LÃ©opold 285",
      city: "HermÃ©e",
      province: "LiÃ¨ge",
      zip: "4680",
    },
    {
      name: "Belize",
      dial_code: "+501",
      code: "BZ",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Benin",
      dial_code: "+229",
      code: "BJ",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Bermuda",
      dial_code: "+1441",
      code: "BM",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Bhutan",
      dial_code: "+975",
      code: "BT",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Bolivia, Plurinational State of",
      dial_code: "+591",
      code: "BO",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Bosnia and Herzegovina",
      dial_code: "+387",
      code: "BA",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Botswana",
      dial_code: "+267",
      code: "BW",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Bonaire, Sint Eustatius and Saba",
      dial_code: "+55",
      code: "BQ",
      address1: "Rua Carlos Gomes 543",
      city: "Cascavel",
      province: "ParanÃ¡",
      postal_code: "85801-090",
    },
    {
      name: "Brazil",
      dial_code: "+55",
      code: "BR",
      address1: "Rua Carlos Gomes 543",
      city: "Cascavel",
      province: "ParanÃ¡",
      postal_code: "85801-090",
    },
    {
      name: "British Indian Ocean Territory",
      dial_code: "+246",
      code: "IO",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Brunei Darussalam",
      dial_code: "+673",
      code: "BN",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Bulgaria",
      dial_code: "+359",
      code: "BG",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Burkina Faso",
      dial_code: "+226",
      code: "BF",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Burundi",
      dial_code: "+257",
      code: "BI",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Cambodia",
      dial_code: "+855",
      code: "KH",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Cameroon",
      dial_code: "+237",
      code: "CM",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Canada",
      dial_code: "+1",
      code: "CA",
      address1: "649 Humboldt St",
      city: "Victoria",
      province_code: "BC",
      province: "British Columbia",
      zip: "V8W 1A7",
    },
    {
      name: "Cape Verde",
      dial_code: "+238",
      code: "CV",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Cayman Islands",
      dial_code: "+ 345",
      code: "KY",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Central African Republic",
      dial_code: "+236",
      code: "CF",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Chad",
      dial_code: "+235",
      code: "TD",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Chile",
      dial_code: "+56",
      code: "CL",
      address1: "Av. Carlos Valdovinos 200",
      city: "San Joaquín",
      province: "Región Metropolitana",
      postal_code: "",
    },
    {
      name: "China",
      dial_code: "+86",
      code: "CN",
      address1: "Jia Zhou Yang Guang Cheng B1-304shi",
      city: "Quanzhoushi",
      province: "Fujian",
      postal_code: "",
    },
    {
      name: "Christmas Island",
      dial_code: "+61",
      code: "CX",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Cocos (Keeling) Islands",
      dial_code: "+61",
      code: "CC",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Colombia",
      dial_code: "+57",
      code: "CO",
      address1: "cr 74 4837 Of. 334",
      city: "MedellÃ­n",
      province: "MedellÃ­n",
      postal_code: "",
    },
    {
      name: "Comoros",
      dial_code: "+269",
      code: "KM",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Congo",
      dial_code: "+242",
      code: "CG",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Congo, The Democratic Republic of the Congo",
      dial_code: "+243",
      code: "CD",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Cook Islands",
      dial_code: "+682",
      code: "CK",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Costa Rica",
      dial_code: "+506",
      code: "CR",
      address1: "Alajuela, Central Alajuela",
      city: "Central Alajuela",
      province: "Alajuela",
      postal_code: "",
    },
    {
      name: "Cote d'Ivoire",
      dial_code: "+225",
      code: "CI",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Croatia",
      dial_code: "+385",
      code: "HR",
      address1: "Zvonimirova 24a, 51000",
      city: "Rijeka",
      province: "Rijeka",
      postal_code: "51000",
    },
    {
      name: "Cuba",
      dial_code: "+53",
      code: "CU",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Curaçao",
      dial_code: "+357",
      code: "CW",
      address1: "12 Michail Georgalla 2320 Lakatameia",
      city: "Nicosia",
      province: "Nicosia",
      postal_code: "2320",
    },
    {
      name: "Cyprus",
      dial_code: "+357",
      code: "CY",
      address1: "12 Michail Georgalla 2320 Lakatameia",
      city: "Nicosia",
      province: "Nicosia",
      postal_code: "2320",
    },
    {
      name: "Czech Republic",
      dial_code: "+420",
      code: "CZ",
      address1: "PolnÃ­ 1397",
      city: "LÃ­Å¡tany",
      province: "PlzenskÃ½ kraj",
      postal_code: "330 35",
    },
    {
      name: "Denmark",
      dial_code: "+45",
      code: "DK",
      address1: "GartnervÃ¦nget 73",
      city: "Vodskov",
      province: "Region Nordjylland",
      postal_code: "9310",
    },
    {
      name: "Djibouti",
      dial_code: "+253",
      code: "DJ",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Dominica",
      dial_code: "+1767",
      code: "DM",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Dominican Republic",
      dial_code: "+1849",
      code: "DO",
      address1: "V Olga Prol 11 No 13",
      city: "Santiago",
      province: "Santiago",
      postal_code: "",
    },
    {
      name: "Ecuador",
      dial_code: "+593",
      code: "EC",
      address1: "A Lascano 301",
      city: "Guayas",
      province: "Guayaquil",
      postal_code: "",
    },
    {
      name: "Egypt",
      dial_code: "+20",
      code: "EG",
      address1: "19 El Iqbal St., EL SARAYA",
      city: "Alexandria",
      province: "Alexandria",
      postal_code: "",
    },
    {
      name: "El Salvador",
      dial_code: "+503",
      code: "SV",
      address1: "Bo El Calvario 2 Cl Pte Y 3 Av Sur Loc 5",
      city: "Ilobasco",
      province: "CabaÃ±as",
      postal_code: "",
    },
    {
      name: "Equatorial Guinea",
      dial_code: "+240",
      code: "GQ",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Eritrea",
      dial_code: "+291",
      code: "ER",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Estonia",
      dial_code: "+372",
      code: "EE",
      address1: "Vahtra 21",
      city: "LaokÃ¼la",
      province: "Harjumaa",
      postal_code: "76714",
    },
    {
      name: "Ethiopia",
      dial_code: "+251",
      code: "ET",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Falkland Islands (Malvinas)",
      dial_code: "+500",
      code: "FK",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Faroe Islands",
      dial_code: "+298",
      code: "FO",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Fiji",
      dial_code: "+679",
      code: "FJ",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Finland",
      dial_code: "+358",
      code: "FI",
      address1: "HÃ¤tilÃ¤nkatu 31",
      city: "Lahti",
      province: "PÃ¤ijÃ¤nne Tavastia",
      postal_code: "15830",
    },
    {
      name: "France",
      dial_code: "+33",
      code: "FR",
      address1: "80 rue Victor Hugo",
      city: "CompiÃˆgne",
      province: "Picardie",
      zip: "60200",
    },
    {
      name: "French Guiana",
      dial_code: "+594",
      code: "GF",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "French Polynesia",
      dial_code: "+689",
      code: "PF",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "French Southern Territories",
      dial_code: "+33",
      code: "TF",
      address1: "80 rue Victor Hugo",
      city: "CompiÃˆgne",
      province: "Picardie",
      zip: "60200",
    },
    {
      name: "Gabon",
      dial_code: "+241",
      code: "GA",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Gambia",
      dial_code: "+220",
      code: "GM",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Georgia",
      dial_code: "+995",
      code: "GE",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Germany",
      dial_code: "+49",
      code: "DE",
      address1: "Billwerder Neuer Deich 38",
      city: "Rehau",
      province: "Freistaat Bayern",
      zip: "95101",
    },
    {
      name: "Ghana",
      dial_code: "+233",
      code: "GH",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Gibraltar",
      dial_code: "+350",
      code: "GI",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Greece",
      dial_code: "+30",
      code: "GR",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "142 32",
    },
    {
      name: "Greenland",
      dial_code: "+299",
      code: "GL",
      address1: "23 Main St",
      city: "Nuuk",
      province: "",
      zip: "GL-3900",
    },
    {
      name: "Grenada",
      dial_code: "+1473",
      code: "GD",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Guadeloupe",
      dial_code: "+590",
      code: "GP",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Guam",
      dial_code: "+1671",
      code: "GU",
      address1: "23 Main St",
      city: "",
      province: "Guam",
      zip: "96999",
    },
    {
      name: "Guatemala",
      dial_code: "+502",
      code: "GT",
    },
    {
      name: "Guernsey",
      dial_code: "+44",
      code: "GG",
      address1: "73 Les Vardes",
      city: "Guernsey",
      province: "",
      zip: "GY1 1DQ",
    },
    {
      name: "Guinea",
      dial_code: "+224",
      code: "GN",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Guinea-Bissau",
      dial_code: "+245",
      code: "GW",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Guyana",
      dial_code: "+595",
      code: "GY",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Haiti",
      dial_code: "+509",
      code: "HT",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Holy See (Vatican City State)",
      dial_code: "+379",
      code: "VA",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Honduras",
      dial_code: "+504",
      code: "HN",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Hong Kong",
      dial_code: "+852",
      code: "HK",
      address1: "139 Connaught Rd W",
      city: "Sai Ying Pun",
      province: "Hong Kong",
      zip: "",
    },
    {
      name: "Hungary",
      dial_code: "+36",
      code: "HU",
      address1: "WesselÃ©nyi u. 17.",
      city: "Kisbodak",
      province: "GyÅ‘r-Moson-Sopron",
      zip: "9234",
    },
    {
      name: "Iceland",
      dial_code: "+354",
      code: "IS",
      address1: "Laugavegur 22",
      city: "101 ReykjavÃ­k",
      province: "",
      zip: "",
    },
    {
      name: "India",
      dial_code: "+91",
      code: "IN",
      address1: "B 17 Sector 4",
      city: "Delhi",
      province: "Uttar Pradesh",
      zip: "201301",
    },
    {
      name: "Indonesia",
      dial_code: "+62",
      code: "ID",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Iran, Islamic Republic of Persian Gulf",
      dial_code: "+98",
      code: "IR",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Iraq",
      dial_code: "+964",
      code: "IQ",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Ireland",
      dial_code: "+353",
      code: "IE",
      address1: "43 Grand Parade",
      city: "Cork",
      province: "County Cork",
      zip: "T12 XK00",
    },
    {
      name: "Isle of Man",
      dial_code: "+44",
      code: "IM",
      address1: "Central Promenade",
      city: "Douglas",
      province: "",
      zip: "IM2 4NA",
    },
    {
      name: "Israel",
      dial_code: "+972",
      code: "IL",
      address1: "Ahad Ha'Am St 43",
      city: "Tel Aviv-Yafo",
      province: "",
      zip: "",
    },
    {
      name: "Italy",
      dial_code: "+39",
      code: "IT",
      address1: "Via Cavour 8",
      city: "Giano Vetusto",
      province: "Caserta",
      zip: "81042",
    },
    {
      name: "Jamaica",
      dial_code: "+1876",
      code: "JM",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Japan",
      dial_code: "+81",
      code: "JP",
      address1: "Minamikoiwa 6 Chome 31",
      city: "Edogawa City",
      province: "JP-13",
      zip: "133-0056",
    },
    {
      name: "Jersey",
      dial_code: "+44",
      code: "JE",
      address1: "19-22 Beresford St",
      city: "Jersey",
      province: "",
      zip: "JE2 4WX",
    },
    {
      name: "Jordan",
      dial_code: "+962",
      code: "JO",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Kazakhstan",
      dial_code: "+77",
      code: "KZ",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Kenya",
      dial_code: "+254",
      code: "KE",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Kiribati",
      dial_code: "+686",
      code: "KI",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Korea, Democratic People's Republic of Korea",
      dial_code: "+850",
      code: "KP",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Korea, Republic of South Korea",
      dial_code: "+82",
      code: "KR",
      address1: "214-7, Hwageumri, Seocheon-eup",
      city: "Seocheon-gun",
      province: "Chungcheongnam-do",
      zip: "",
    },
    {
      name: "Kosovo",
      dial_code: "+383",
      code: "XK",
      address1: "XK, 5 Fehmi Agani",
      city: "Prishtina",
      province: "Prishtina",
      zip: "10000",
    },
    {
      name: "Kuwait",
      dial_code: "+965",
      code: "KW",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Kyrgyzstan",
      dial_code: "+996",
      code: "KG",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Laos",
      dial_code: "+856",
      code: "LA",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Latvia",
      dial_code: "+371",
      code: "LV",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Lebanon",
      dial_code: "+961",
      code: "LB",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Lesotho",
      dial_code: "+266",
      code: "LS",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Liberia",
      dial_code: "+231",
      code: "LR",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Libyan Arab Jamahiriya",
      dial_code: "+218",
      code: "LY",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Liechtenstein",
      dial_code: "+423",
      code: "LI",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Lithuania",
      dial_code: "+370",
      code: "LT",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Luxembourg",
      dial_code: "+352",
      code: "LU",
      address1: "3 Route De Stadtbredimus",
      city: "Luxembourg",
      province: "Luxembourg",
      zip: "",
    },
    {
      name: "Macao",
      dial_code: "+853",
      code: "MO",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Macedonia",
      dial_code: "+389",
      code: "MK",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Madagascar",
      dial_code: "+261",
      code: "MG",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Malawi",
      dial_code: "+265",
      code: "MW",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Malaysia",
      dial_code: "+60",
      code: "MY",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Maldives",
      dial_code: "+960",
      code: "MV",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Mali",
      dial_code: "+223",
      code: "ML",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Malta",
      dial_code: "+356",
      code: "MT",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Marshall Islands",
      dial_code: "+692",
      code: "MH",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Martinique",
      dial_code: "+596",
      code: "MQ",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Mauritania",
      dial_code: "+222",
      code: "MR",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Mauritius",
      dial_code: "+230",
      code: "MU",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Mayotte",
      dial_code: "+262",
      code: "YT",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Mexico",
      dial_code: "+52",
      code: "MX",
      address1: "40 NTE 6, CIVAC, 62500",
      city: "Morelos",
      province: "Morelos",
      zip: "62500",
    },
    {
      name: "Micronesia, Federated States of Micronesia",
      dial_code: "+691",
      code: "FM",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Moldova",
      dial_code: "+373",
      code: "MD",
      address1: "Bure, bld. 66/2, appt. 64",
      city: "Kishinev",
      province: "Moldova",
      zip: "",
    },
    {
      name: "Monaco",
      dial_code: "+377",
      code: "MC",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Mongolia",
      dial_code: "+976",
      code: "MN",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Montenegro",
      dial_code: "+382",
      code: "ME",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Montserrat",
      dial_code: "+1664",
      code: "MS",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Morocco",
      dial_code: "+212",
      code: "MA",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Mozambique",
      dial_code: "+258",
      code: "MZ",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Myanmar",
      dial_code: "+95",
      code: "MM",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Namibia",
      dial_code: "+264",
      code: "NA",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Nauru",
      dial_code: "+674",
      code: "NR",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Nepal",
      dial_code: "+977",
      code: "NP",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Netherlands",
      dial_code: "+31",
      code: "NL",
      address1: "Jan Kammingakade 78",
      city: "Wildervank",
      province: "Groningen",
      zip: "9648 KN",
    },
    {
      name: "Netherlands Antilles",
      dial_code: "+599",
      code: "AN",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "New Caledonia",
      dial_code: "+687",
      code: "NC",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "New Zealand",
      dial_code: "+64",
      code: "NZ",
      address1: "228 Alyson Place",
      city: "Nelson Airport",
      province: "Nelson",
      zip: "7011",
    },
    {
      name: "Nicaragua",
      dial_code: "+505",
      code: "NI",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Niger",
      dial_code: "+227",
      code: "NE",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Nigeria",
      dial_code: "+234",
      code: "NG",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Niue",
      dial_code: "+683",
      code: "NU",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Norfolk Island",
      dial_code: "+672",
      code: "NF",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Northern Mariana Islands",
      dial_code: "+1670",
      code: "MP",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Norway",
      dial_code: "+47",
      code: "NO",
      address1: "Kruttverkveien 208",
      city: "Nittedal",
      province: "",
      zip: "1482",
    },
    {
      name: "Oman",
      dial_code: "+968",
      code: "OM",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Pakistan",
      dial_code: "+92",
      code: "PK",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Palau",
      dial_code: "+680",
      code: "PW",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Palestinian Territory, Occupied",
      dial_code: "+970",
      code: "PS",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Panama",
      dial_code: "+507",
      code: "PA",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Papua New Guinea",
      dial_code: "+675",
      code: "PG",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Paraguay",
      dial_code: "+595",
      code: "PY",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Peru",
      dial_code: "+51",
      code: "PE",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Philippines",
      dial_code: "+63",
      code: "PH",
      address1: "Baluma Building, Quezon Avenue",
      city: "Dipolog",
      province: "Zamboanga del Norte",
      zip: "",
    },
    {
      name: "Pitcairn",
      dial_code: "+872",
      code: "PN",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Poland",
      dial_code: "+48",
      code: "PL",
      address1: "ul. Konna 10",
      city: "Katowice",
      province: "",
      zip: "40-320",
    },
    {
      name: "Portugal",
      dial_code: "+351",
      code: "PT",
      address1: "Av. António Augusto de Aguiar 31",
      city: "Lisboa",
      province: "",
      zip: "1069-413",
    },
    {
      name: "Puerto Rico",
      dial_code: "+1939",
      code: "PR",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Qatar",
      dial_code: "+974",
      code: "QA",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Romania",
      dial_code: "+40",
      code: "RO",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Russia",
      dial_code: "+7",
      code: "RU",
      address1: "Kalinina Ul., bld. 65, appt. 39",
      city: "Ekaterinburg",
      province: "Sverdlovskaya oblast",
      zip: "",
    },
    {
      name: "Rwanda",
      dial_code: "+250",
      code: "RW",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Reunion",
      dial_code: "+262",
      code: "RE",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Saint Barthelemy",
      dial_code: "+590",
      code: "BL",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Saint Helena, Ascension and Tristan Da Cunha",
      dial_code: "+290",
      code: "SH",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Saint Kitts and Nevis",
      dial_code: "+1869",
      code: "KN",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Saint Lucia",
      dial_code: "+1758",
      code: "LC",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Saint Martin",
      dial_code: "+590",
      code: "MF",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Saint Pierre and Miquelon",
      dial_code: "+508",
      code: "PM",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Saint Vincent and the Grenadines",
      dial_code: "+1784",
      code: "VC",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Samoa",
      dial_code: "+685",
      code: "WS",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "San Marino",
      dial_code: "+378",
      code: "SM",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Sao Tome and Principe",
      dial_code: "+239",
      code: "ST",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Saudi Arabia",
      dial_code: "+966",
      code: "SA",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Senegal",
      dial_code: "+221",
      code: "SN",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Serbia",
      dial_code: "+381",
      code: "RS",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Seychelles",
      dial_code: "+248",
      code: "SC",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Sierra Leone",
      dial_code: "+232",
      code: "SL",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Singapore",
      dial_code: "+65",
      code: "SG",
      address1: "20 Maxwell Road #08-09 Maxwell House",
      city: "Singapore",
      province: "",
      zip: "069113",
    },
    {
      name: "Slovakia",
      dial_code: "+421",
      code: "SK",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Slovenia",
      dial_code: "+386",
      code: "SI",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Solomon Islands",
      dial_code: "+677",
      code: "SB",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Somalia",
      dial_code: "+252",
      code: "SO",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "South Africa",
      dial_code: "+27",
      code: "ZA",
      address1: "84 7th Ave, Belgravia",
      city: "Cape Town",
      province: "",
      zip: "7764",
    },
    {
      name: "South Sudan",
      dial_code: "+211",
      code: "SS",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "South Georgia and the South Sandwich Islands",
      dial_code: "+500",
      code: "GS",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Spain",
      dial_code: "+34",
      code: "ES",
      address1: "Av. Zumalakarregi 77",
      city: "Algorfa",
      province: "Alicante",
      zip: "03169",
    },
    {
      name: "Sri Lanka",
      dial_code: "+94",
      code: "LK",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Sint Maarten (Dutch part)",
      dial_code: "+34",
      code: "SX",
      address1: "Av. Zumalakarregi 77",
      city: "Algorfa",
      province: "Alicante",
      zip: "03169",
    },
    {
      name: "Sudan",
      dial_code: "+249",
      code: "SD",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Suriname",
      dial_code: "+597",
      code: "SR",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Svalbard and Jan Mayen",
      dial_code: "+47",
      code: "SJ",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Swaziland",
      dial_code: "+268",
      code: "SZ",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Sweden",
      dial_code: "+46",
      code: "SE",
      address1: "Villagatan 34",
      city: "Gullholmen",
      province: "",
      zip: "440 84",
    },
    {
      name: "Switzerland",
      dial_code: "+41",
      code: "CH",
      address1: "Kornquaderweg 135",
      city: "Reute",
      province: "",
      zip: "9411",
    },
    {
      name: "Syrian Arab Republic",
      dial_code: "+963",
      code: "SY",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Taiwan",
      dial_code: "+886",
      code: "TW",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Tajikistan",
      dial_code: "+992",
      code: "TJ",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Tanzania, United Republic of Tanzania",
      dial_code: "+255",
      code: "TZ",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Thailand",
      dial_code: "+66",
      code: "TH",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Timor-Leste",
      dial_code: "+670",
      code: "TL",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Togo",
      dial_code: "+228",
      code: "TG",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Tokelau",
      dial_code: "+690",
      code: "TK",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Tonga",
      dial_code: "+676",
      code: "TO",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Trinidad and Tobago",
      dial_code: "+1868",
      code: "TT",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Tunisia",
      dial_code: "+216",
      code: "TN",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Tristan da Cunha",
      dial_code: "+971",
      code: "TA",
      address1: "Mussafah - 7th St",
      city: "Abu Dhabi",
      province: "AZ",
      zip: "",
    },
    {
      name: "Turkey",
      dial_code: "+90",
      code: "TR",
      address1: "Allianz Tower, Küçükbakkalköy Mah.  ",
      city: "İstanbul",
      province: "",
      zip: "34750",
    },
    {
      name: "Turkmenistan",
      dial_code: "+993",
      code: "TM",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Turks and Caicos Islands",
      dial_code: "+1649",
      code: "TC",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Tuvalu",
      dial_code: "+688",
      code: "TV",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Uganda",
      dial_code: "+256",
      code: "UG",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Ukraine",
      dial_code: "+380",
      code: "UA",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "United Arab Emirates",
      dial_code: "+971",
      code: "AE",
      address1: "Mussafah - 7th St",
      city: "Abu Dhabi",
      province: "AZ",
      zip: "",
    },
    {
      name: "United Kingdom",
      dial_code: "+44",
      code: "GB",
      address1: "9 Belvedere Rd",
      city: "London",
      province: "England",
      zip: "SE1 8YL",
    },
    {
      name: "United States",
      dial_code: "+1",
      code: "US",
      address1: "1313 South Harbor Blvd",
      city: "Anaheim",
      province: "California",
      province_code: "CA",
      zip: "92802",
    },
    {
      name: "United States Minor Outlying Islands",
      dial_code: "+1",
      code: "UM",
      address1: "1313 South Harbor Blvd",
      city: "Anaheim",
      province: "California",
      province_code: "CA",
      zip: "92802",
    },
    {
      name: "Uruguay",
      dial_code: "+598",
      code: "UY",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Uzbekistan",
      dial_code: "+998",
      code: "UZ",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Vanuatu",
      dial_code: "+678",
      code: "VU",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Venezuela, Bolivarian Republic of Venezuela",
      dial_code: "+58",
      code: "VE",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Vietnam",
      dial_code: "+84",
      code: "VN",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Virgin Islands, British",
      dial_code: "+1284",
      code: "VG",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Virgin Islands, U.S.",
      dial_code: "+1340",
      code: "VI",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Wallis and Futuna",
      dial_code: "+681",
      code: "WF",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Western Sahara",
      dial_code: "+1",
      code: "EH",
      address1: "1313 South Harbor Blvd",
      city: "Anaheim",
      province: "California",
      province_code: "CA",
      zip: "92802",
    },
    {
      name: "Yemen",
      dial_code: "+967",
      code: "YE",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Zambia",
      dial_code: "+260",
      code: "ZM",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
    {
      name: "Zimbabwe",
      dial_code: "+263",
      code: "ZW",
      address1: "23 Main St",
      city: "",
      province: "",
      zip: "",
    },
  ];
  
  let currencies = {
    AED: "د.إ",
    AFN: "؋",
    ALL: "L",
    AMD: "֏",
    ANG: "ƒ",
    AOA: "Kz",
    ARS: "$",
    AUD: "$",
    AWG: "ƒ",
    AZN: "₼",
    BAM: "KM",
    BBD: "$",
    BDT: "৳",
    BGN: "лв",
    BHD: ".د.ب",
    BIF: "FBu",
    BMD: "$",
    BND: "$",
    BOB: "$b",
    BOV: "BOV",
    BRL: "R$",
    BSD: "$",
    BTC: "₿",
    BTN: "Nu.",
    BWP: "P",
    BYN: "Br",
    BYR: "Br",
    BZD: "BZ$",
    CAD: "$",
    CDF: "FC",
    CHE: "CHE",
    CHF: "CHF",
    CHW: "CHW",
    CLF: "CLF",
    CLP: "$",
    CNH: "¥",
    CNY: "¥",
    COP: "$",
    COU: "COU",
    CRC: "₡",
    CUC: "$",
    CUP: "₱",
    CVE: "$",
    CZK: "Kč",
    DJF: "Fdj",
    DKK: "kr",
    DOP: "RD$",
    DZD: "دج",
    EEK: "kr",
    EGP: "£",
    ERN: "Nfk",
    ETB: "Br",
    ETH: "Ξ",
    EUR: "€",
    FJD: "$",
    FKP: "£",
    GBP: "£",
    GEL: "₾",
    GGP: "£",
    GHC: "₵",
    GHS: "GH₵",
    GIP: "£",
    GMD: "D",
    GNF: "FG",
    GTQ: "Q",
    GYD: "$",
    HKD: "$",
    HNL: "L",
    HRK: "kn",
    HTG: "G",
    HUF: "Ft",
    IDR: "Rp",
    ILS: "₪",
    IMP: "£",
    INR: "₹",
    IQD: "ع.د",
    IRR: "﷼",
    ISK: "kr",
    JEP: "£",
    JMD: "J$",
    JOD: "JD",
    JPY: "¥",
    KES: "KSh",
    KGS: "лв",
    KHR: "៛",
    KMF: "CF",
    KPW: "₩",
    KRW: "₩",
    KWD: "KD",
    KYD: "$",
    KZT: "₸",
    LAK: "₭",
    LBP: "£",
    LKR: "₨",
    LRD: "$",
    LSL: "M",
    LTC: "Ł",
    LTL: "Lt",
    LVL: "Ls",
    LYD: "LD",
    MAD: "MAD",
    MDL: "lei",
    MGA: "Ar",
    MKD: "ден",
    MMK: "K",
    MNT: "₮",
    MOP: "MOP$",
    MRO: "UM",
    MRU: "UM",
    MUR: "₨",
    MVR: "Rf",
    MWK: "MK",
    MXN: "$",
    MXV: "MXV",
    MYR: "RM",
    MZN: "MT",
    NAD: "$",
    NGN: "₦",
    NIO: "C$",
    NOK: "kr",
    NPR: "₨",
    NZD: "$",
    OMR: "﷼",
    PAB: "B/.",
    PEN: "S/.",
    PGK: "K",
    PHP: "₱",
    PKR: "₨",
    PLN: "zł",
    PYG: "Gs",
    QAR: "﷼",
    RMB: "￥",
    RON: "lei",
    RSD: "Дин.",
    RUB: "₽",
    RWF: "R₣",
    SAR: "﷼",
    SBD: "$",
    SCR: "₨",
    SDG: "ج.س.",
    SEK: "kr",
    SGD: "S$",
    SHP: "£",
    SLL: "Le",
    SOS: "S",
    SRD: "$",
    SSP: "£",
    STD: "Db",
    STN: "Db",
    SVC: "$",
    SYP: "£",
    SZL: "E",
    THB: "฿",
    TJS: "SM",
    TMT: "T",
    TND: "د.ت",
    TOP: "T$",
    TRL: "₤",
    TRY: "₺",
    TTD: "TT$",
    TVD: "$",
    TWD: "NT$",
    TZS: "TSh",
    UAH: "₴",
    UGX: "USh",
    USD: "$",
    UYI: "UYI",
    UYU: "$U",
    UYW: "UYW",
    UZS: "лв",
    VEF: "Bs",
    VES: "Bs.S",
    VND: "₫",
    VUV: "VT",
    WST: "WS$",
    XAF: "FCFA",
    XBT: "Ƀ",
    XCD: "$",
    XOF: "CFA",
    XPF: "₣",
    XSU: "Sucre",
    XUA: "XUA",
    YER: "﷼",
    ZAR: "R",
    ZMW: "ZK",
    ZWD: "Z$",
    ZWL: "$",
  };

  function getCountry(country) {
    //place call, reset session
    let sessiontoken = crypto.randomUUID();
    let countryAddress = ratesCountryCodes.find(
      (countryCode) => countryCode.name === country
    );
    $("#postalcode")
    .data({
        address1: countryAddress.address1,
        city: countryAddress.city,
        province: countryAddress.province,
        postal_code: countryAddress.zip,
        country_code: countryAddress.code,
        country_name: countryAddress.name,
        province_code: countryAddress.province_code,
    })
    .val(country);
  }

})(jQuery);
}



function getAddress(place_data) {
let address1 = place_data.formatted_address.split(',')[0];
let city = place_data.address_components.find(
  (address_component) =>
    address_component !== null && address_component.types[0] === "locality"
);
if (city) {
  city = city.short_name;
} else {
  city = place_data.address_components.find(
    (address_component) =>
      address_component !== null &&
      address_component.types[0] === "postal_town"
  )
    ? place_data.address_components.find(
        (address_component) =>
          address_component !== null &&
          address_component.types[0] === "postal_town"
      ).short_name
    : "";
}
let code = place_data.address_components.filter(
  (address_component) =>
    address_component !== null && address_component.types[0] === "postal_code"
)[0];
if (typeof code === "undefined") {
  code = "0000";
} else {
  code = code.long_name;
}

let province = place_data.address_components.filter(
  (address_component) =>
    address_component !== null &&
    address_component.types[0] === "administrative_area_level_1"
).length
  ? place_data.address_components.filter(
      (address_component) =>
        address_component !== null &&
        address_component.types[0] === "administrative_area_level_1"
    )[0].short_name
  : "";
let country_code = place_data.address_components.filter(
  (address_component) =>
    address_component !== null && address_component.types[0] === "country"
)[0].short_name;
return {
  address1: address1,
  city: city,
  code: code.split(" ").join(""),
  province: province,
  country_code: country_code,
};
}

function formatMoney(cents, format) {
if (typeof cents == "string") {
  cents = cents.replace(".", "");
}
var value = "";
var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
var formatString = format || this.money_format;

function defaultOption(opt, def) {
  return typeof opt == "undefined" ? def : opt;
}

function formatWithDelimiters(number, precision, thousands, decimal) {
  precision = defaultOption(precision, 2);
  thousands = defaultOption(thousands, ",");
  decimal = defaultOption(decimal, ".");

  if (isNaN(number) || number == null) {
    return 0;
  }

  number = (number / 100.0).toFixed(precision);

  var parts = number.split("."),
    dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + thousands),
    cents = parts[1] ? decimal + parts[1] : "";

  return dollars + cents;
}

switch (formatString.match(placeholderRegex)[1]) {
  case "amount":
    value = formatWithDelimiters(cents, 2);
    break;
  case "amount_no_decimals":
    value = formatWithDelimiters(cents, 0);
    break;
  case "amount_with_comma_separator":
    value = formatWithDelimiters(cents, 2, ".", ",");
    break;
  case "amount_no_decimals_with_comma_separator":
    value = formatWithDelimiters(cents, 0, ".", ",");
    break;
}

return formatString.replace(placeholderRegex, value);
}

const decodeHTML = function (html) {
  var txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};
