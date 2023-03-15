# Product Page Shipping for Shopify

This is the open source versiom of our MT Product Page Shipping app for Shopify. Once set up, the app will display a shipping widget on your product pages.

## Install and setup

1. Set up a Google Cloud project and enable Maps Javascript API by following these instructions:
https://developers.google.com/maps/documentation/javascript/cloud-setup

2. Upload the shopify-product-page-shipping Assets and Snippits to your Shopify theme's folders:

```theme root
      Snippits
        product-shipping.liquid
      Assets
        rates.css
        rates.js
```

3. Open product-shipping.liquid and update GOOGLE_MAPS_API_KEY with your Google Maps API key created in step 1.

## Options set up in product-shipping.liquid

| Option | Type | Example | Description |
| --- | ----------- |
| data-key | `string` | `XXXXXXXXXXXXXXX` | Google Maps API key  |
| data-auto | `true` \| `false` | `true` | Automaticly show rates based on customer location |
| data-free | `string` | `Free` | Text returned when shipping is free / zero |
| data-tags | `string` | `shoes,shirts,sale` | Comma separated list of product tags for showing or hiding the widget |
| data-contains | `true` \| `false` | `true` | Show with or without the above tags. |
| data-search | `address` \| `postal_code` \| `locality%7Cpostal_code` \| `country` | `postal_code` |  Show with or without the above tags |
| data-delivery_singular | `string` | `business day` |  Text returned for singluar delivery days |
| data-delivery_plural | `string` | `business days` |   Text returned for plural delivery days |
| data-countries | `true` \| `false`  | `true` | Restrict address search to listed countries |
| data-countryCodes | `string` | `US,CA,JP,AU` Comma separated list of 2 letter country codes to restrict to (limit 5) |