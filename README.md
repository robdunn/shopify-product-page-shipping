# Product Page Shipping for Shopify

This is the open source versiom of MT Product Page Shipping app for Shopify. Once set up, the app will display a shipping widget on your product pages.

## Install and setup

1. Set up a Google Cloud project and enable Maps Javascript API by following these instructions:
https://developers.google.com/maps/documentation/javascript/cloud-setup

2. In your Google Cloud project enable "Places API", "Geocoding API" and "Geolocation API".

3. In Shopify Admin, navigate to "Online Store" -> "Themes" and "Edit Code" of the theme you'd like to add the widget to.

4. In the code editor, upload the rates.css and rates.js to your theme's Assets folder.

5. Add a new snippit to your themes "Snippits" folder called 'product-shipping.liquid' and paste the contents of product-shipping.liquid into the new file.

6. In product-shipping.liquid update GOOGLE_MAPS_API_KEY with your Google Maps API key created in step 1.

7. Open your product template and paste this code in the location where you'd like to display the widget:

`{% include 'product-shipping', variant: variant, product: product, shop: shop %}`

For the Dawn theme, to have the widget show up below the price, you would want to paste the code into Sections -> main-product.liquid at about line 223, just above the: 

`{% include 'product-shipping', variant: variant, product: product, shop: shop %}`

## Options set up in product-shipping.liquid

| Option | Type | Example | Description |
| ----- | --- | ------- |  ----------- | 
| data-key | `string` | `XXXXXXXXXXXXXXX` | Google Maps API key  |
| data-auto | `true` \| `false` | `true` | Automaticly show rates based on customer location |
| data-free | `string` | `Free` | Text returned when shipping is free / zero |
| data-tags | `string` | `shoes,shirts,sale` | Comma separated list of product tags for showing or hiding the widget |
| data-contains | `true` \| `false` | `true` | Show with or without the above tags. |
| data-types | `address` \| `postal_code` \| `locality%7Cpostal_code` \| `country` | `postal_code` |  Comma separated list of seach types to return |
| data-delivery_singular | `string` | `business day` |  Text returned for singluar delivery days |
| data-delivery_plural | `string` | `business days` |   Text returned for plural delivery days |
| data-countries | `true` \| `false`  | `true` | Restrict address search to listed countries |
| data-countryCodes | `string` | `US,CA,JP,AU` Comma separated list of 2 letter country codes to restrict to (limit 5) |