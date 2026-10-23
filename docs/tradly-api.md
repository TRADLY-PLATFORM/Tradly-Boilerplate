# Tradly API index

Generated from https://developer.tradly.app/llms.txt (271 endpoints). Each row: method, documented path, title, docs page. Docs pages are relative to https://developer.tradly.app; append `.md` to read the full page (params, request body, response). New APIs land on developer.tradly.app first, so when this file and the live index disagree, trust the live one.

Path placeholders appear as `{{id}}` or `:id`. See AGENTS.md for how to call these from the app.

## Authentication

- `POST /skua/tenant_oauth/token` — Authorization — /authorization

## Users

- `POST /v1/users/register` — Register (Email & Password) — /register-email-password
- `POST /v1/users/register` — Register (Mobile & OTP) — /register-mobile-otp
- `POST /v1/users/login` — Login (Email & Password) — /login-email-password
- `POST /v1/users/login` — Login (Mobile & OTP) — /login-mobile-otp
- `POST /v1/users/register` — Register (Mobile & Password) — /register-mobile-password
- `POST /v1/users/login` — Login (Mobile & Password) — /login-mobile-password
- `POST /v1/users/verify` — Verify — /verify
- `POST /v1/users/password/recovery` — Password Recovery — /password-recovery
- `POST /v1/users/password/set` — Password Set — /password-set
- `POST /v1/users` — Create User [ADMIN] — /create-user-admin
- `GET /v1/users` — Users List — /users-list
- `GET /v1/users/{{user_id}}` — User Detail — /user-detail
- `GET /v1/users/account_followers/{{account_id}}` — Account Followers — /account-followers
- `GET /v1/users/token/refresh` — Token Refresh — /token-refresh
- `PATCH /v1/users/{{user_id}}` — Update User — /update-user
- `POST /v1/users/password/change` — Change Password — /change-password
- `POST /v1/users/logout` — Logout — /logout

## Accounts

- `POST /v1/accounts` — Add Account — /add-account
- `PUT /v1/accounts/{{account_id}}` — Edit Account — /edit-account
- `PATCH /v1/accounts/{{account_id}}` — Patch Account — /patch-account
- `GET /v1/accounts` — Account List — /account-list
- `GET /v1/accounts/{{account_id}}` — Account Detail — /account-detail
- `POST /v1/accounts/{{account_id}}/block` — Block Account — /block-account
- `POST /v1/accounts/{{account_id}}/moderate` — Moderate Account — /moderate-account

## Catalogue

- `POST /v1/listings` — Add Listing — /listings/add-listing
- `PATCH /v1/listings/{{listing_id}}` — Edit Listing — /listings/edit-listing
- `GET /v1/listings` — Listings List — /listings/listings-list
- `GET /v1/listings/{{listing_id}}` — Listing Detail — /listings/listing-detail
- `GET /v1/listings/search/suggestions` — Search Suggestions — /listings/search-suggestions
- `DELETE /v1/listings/{{listing_id}}` — Delete Listing — /listings/delete-listing
- `POST /v1/listings/{{listing_id}}/sold` — Mark as Sold — /listings/mark-as-sold
- `POST /v1/listings/{{listing_id}}/moderate` — Moderate Listings — /listings/moderate-listings
- `GET /v1/listings/likes` — Listings Likes — /listings/listings-likes
- `GET /v1/listings/unique/locations` — Unique Locations — /listings/unique-locations
- `GET /v1/listings/{{listing_id}}/schedules_per_day` — Listings Schedules Per Day — /listings/listings-schedules-per-day
- `POST /v1/listings/{{listing_id}}/negotiations` — Create Negotiations — /listings/create-negotiations
- `PATCH /v1/listings/{{listing_id}}/negotiations/{{negotiation_id}}` — Update Negotiation Status — /listings/update-negotiation-status
- `GET /v1/listings/reported/list` — Reported Listings [ADMIN] — /listings/reported-listings-admin
- `GET /v1/variant_types` — Listing Variant Types — /listing-variant-types/listing-variant-types
- `GET /v1/variant_types/{{variant_type_id}}` — Listing Variant Type Detail — /listing-variant-types/listing-variant-type-detail
- `POST /v1/variant_types` — Add Listing Variant Type — /listing-variant-types/add-listing-variant-type
- `PUT /v1/variant_types/{{variant_type_id}}` — Edit Listing Variant Type — /listing-variant-types/edit-listing-variant-type
- `DELETE /v1/variant_types/{{variant_type_id}}` — Delete Listing Variant Type — /listing-variant-types/delete-listing-variant-type
- `GET /v1/variant_types/{{variant_type_id}}/values` — Listing Variant Type Values — /listing-variant-types/listing-variant-type-values
- `GET /v1/variant_types/{{variant_type_id}}/values/{{variant_type_value_id}}` — Listing Variant Type Value Detail — /listing-variant-types/listing-variant-type-value-detail
- `POST /v1/variant_types/{{variant_type_id}}/values` — Add Listing Variant Type Value — /listing-variant-types/add-listing-variant-type-value
- `PUT /v1/variant_types/{{variant_type_id}}/values/{{variant_type_value_id}}` — Edit Listing Variant Type Value — /listing-variant-types/edit-listing-variant-type-value
- `DELETE /v1/variant_types/{{variant_type_id}}/values/{{variant_type_value_id}}` — Delete Listing Variant Type Value — /listing-variant-types/delete-listing-variant-type-value
- `GET /v1/listings/{{listing_id}}/variants` — Listing Variants — /listing-variants/listing-variants
- `GET /v1/listings/{{listing_id}}/variants/{{variant_id}}` — Listing Variant Detail — /listing-variants/listing-variant-detail
- `POST /v1/listings/{{listing_id}}/variants` — Add Listing Variant — /listing-variants/add-listing-variant
- `PUT /v1/listings/{{listing_id}}/variants/{{variant_id}}` — Edit Listing Variant — /listing-variants/edit-listing-variant
- `DELETE /v1/listings/{{listing_id}}/variants/{{variant_id}}` — Delete Listing Variant — /listing-variants/delete-listing-variant

## Merchandising

- `GET /v1/bundles/:listing_id/items` — List Bundle Items — /bundles/list-bundle-items
- `POST /v1/bundles/:listing_id/items` — Add Bundle Item — /bundles/add-bundle-item
- `PUT /v1/bundles/:listing_id/items/:item_id` — Update Bundle Item — /bundles/update-bundle-item
- `DELETE /v1/bundles/:listing_id/items/:item_id` — Delete Bundle Item — /bundles/delete-bundle-item
- `GET /v1/bundles/:listing_id/stock` — Check Bundle Stock — /bundles/bundle-stock
- `GET /v1/bundles/:listing_id/orders/:order_id/components` — Bundle Order Components — /bundles/bundle-order-components
- `GET /v1/bundles/:listing_id/pool` — List Pool Items — /bundles/list-pool-items
- `POST /v1/bundles/:listing_id/pool` — Add Pool Item — /bundles/add-pool-item
- `PUT /v1/bundles/:listing_id/pool/:item_id` — Update Pool Item — /bundles/update-pool-item
- `DELETE /v1/bundles/:listing_id/pool/:item_id` — Delete Pool Item — /bundles/delete-pool-item
- `POST /v1/bundles/:listing_id/select` — Submit Mix & Match Selection — /bundles/submit-selection
- `GET /v1/bundles/:listing_id/selections/:selection_id` — Selection Detail — /bundles/selection-detail
- `GET /v1/tags/search` — Tags Search — /tags/tags-search
- `GET /` — Get Collections — /collections/get-collections
- `GET /` — Get Collection Detail — /collections/get-collection-detail
- `POST /` — Add Collections — /collections/add-collections
- `PUT /` — Edit Collection — /collections/edit-collection
- `DELETE /` — Delete Collection — /collections/delete-collection
- `GET /v1/promos` — Promotions List — /promotions/promotions-list
- `GET /v1/promos/{{promo_banner_id}}` — Promotions Detail — /promotions/promotions-detail
- `POST /v1/promos` — Add Promotion — /promotions/add-promotion
- `PUT /v1/promos/{{promo_banner_id}}` — Edit Promotion — /promotions/edit-promotion
- `DELETE /v1/promos/{{promo_banner_id}}` — Delete Promotion — /promotions/delete-promotion
- `POST /v1/coupons` — Add Coupon — /coupons/add-coupon

## Social

- `GET /v1/reviews` — Reviews List — /reviews/reviews-list
- `POST /v1/reviews` — Add Review — /reviews/add-review
- `PATCH /v1/reviews/1/like` — Like/Unlike Review — /reviews/like-unlike-review
- `GET /v1/comments` — Comments List — /comments/comments-list
- `GET /v1/comments/{{comment_id}}` — Comment Detail — /comments/comment-detail
- `POST /v1/comments` — Add Comment — /comments/add-comment
- `PUT /v1/comments/{{comment_id}}` — Edit Comment — /comments/edit-comment
- `DELETE /v1/comments/{{comment_id}}` — Delete Comment — /comments/delete-comment
- `POST /v1/comments/{{comment_id}}/likes` — Like Comment — /comments/like-comment
- `DELETE /v1/comments/{{comment_id}}/likes` — Delete Like — /comments/delete-like
- `POST /v1/comments/{{comment_id}}/unlikes` — Dislike Comment — /comments/dislike-comment
- `DELETE /v1/comments/{{comment_id}}/unlikes` — Delete Dislike — /comments/delete-dislike
- `GET /v1/activities` — Activity List — /activities/activity-list
- `GET /v1/home` — Home — /feeds/home
- `DELETE /v1/accounts/{{account_id}}/block` — UnBlock Account — /unblock-account
- `POST /v1/accounts/{{account_id}}/follow` — Follow Account — /follow-account
- `DELETE /v1/accounts/{{account_id}}/follow` — UnFollow Account — /unfollow-account
- `DELETE /v1/listings/{{listing_id}}/likes` — UnLike Listing — /unlike-listing
- `POST /v1/listings/{{listing_id}}/likes` — Like Listing — /like-listing
- `GET /v1/feeds/following` — Social Feeds : Following — /social-feeds-following

## Shipping Methods

- `GET /v1/tenants/shipping_methods` — Tenant Shipping Methods — /tenant-shipping-methods

## Payments

- `GET /v1/tenants/payment_methods` — Payment Methods — /payment-methods/payment-methods
- `POST /app/v1/payments/stripe/ephemeralKey` — Ephemeral Key — /stripe/ephemeral-key
- `POST /app/v1/payments/stripe/paymentIntent` — Payment Intent — /stripe/payment-intent
- `GET /v1/payments/stripe/connect/oauth` — Connect OAuth — /stripe/connect-oauth
- `DELETE /v1/payments/stripe/connect/oauth` — Disconnect OAuth — /stripe/disconnect-oauth
- `POST /app/v1/payments/stripe/connect/account_links` — Create Account Links — /stripe/create-account-links
- `POST /app/v1/payments/stripe/connect/login_links` — Create Express Login Link — /stripe/create-express-login-link
- `GET /v1/payments/stripe/connect/account` — Stripe Connect Account — /stripe/stripe-connect-account
- `GET /v1/payments/stripe/products` — Stripe Produts — /stripe/stripe-produts
- `POST /app/v1/payments/payulatam/paymentIntent` — Payment Intent — /payu-latam/payment-intent

## Checkout

- `POST /v1/cart` — Add To Cart — /cart/add-to-cart
- `PATCH /v1/cart` — Delete from Cart — /cart/delete-from-cart
- `GET /v1/cart` — Get Cart — /cart/get-cart
- `POST /v1/cart/checkout` — Checkout — /cart/checkout
- `DELETE /v1/cart` — Delete all cart details — /cart/delete-all-cart-details
- `GET /v1/orders` — Orders List — /orders/orders
- `GET /v1/orders/{{order_id}}` — Order Details — /orders/order-details
- `PATCH /v1/orders/{{order_id}}/status` — Update Order Status — /orders/update-order-status
- `PATCH /v1/orders/{{order_id}}/shipments/{{shipment_id}}/status` — Update Shipment Status — /orders/update-shipment-status
- `PATCH /v1/orders/{{order_id}}/confirm` — Confirm Order — /orders/confirm-order
- `GET /v1/transactions` — Transactions — /transactions/transactions
- `GET /v1/earnings` — Earnings — /transactions/earnings

## Commissions

- `GET /` — Commission List — /commission-list
- `GET /` — Commission Detail — /commission-detail
- `POST /` — Add Commissions — /add-commissions
- `PUT /` — Edit Commissions — /edit-commissions
- `DELETE /` — Delete Commissions — /delete-commissions
- `POST /` — Calculate Commissions — /calculate-commissions

## Commons

- `GET /v1/categories` — Categories List — /categories/categories-list
- `GET /v1/categories/{{category_id}}` — Category Detail — /categories/category-detail
- `POST /v1/categories` — Add Category — /categories/add-category
- `PUT /v1/categories/{{category_id}}` — Edit Category — /categories/edit-category
- `PATCH /v1/categories/bulk` — Edit Category [BULK] — /categories/edit-category-bulk
- `DELETE /v1/categories/{{category_id}}` — Delete Category — /categories/delete-category
- `GET /v1/attribute_groups` — Attribute Groups List — /attribute-groups/attribute-groups-list
- `GET /v1/attribute_groups/{{attribute_group_id}}` — Attribute Group Detail — /attribute-groups/attribute-group-detail
- `POST /v1/attribute_groups` — Add Attribute Group — /attribute-groups/add-attribute-group
- `PUT /v1/attribute_groups/{{attribute_group_id}}` — Edit Attribute Group — /attribute-groups/edit-attribute-group
- `DELETE /v1/attribute_groups/{{attribute_group_id}}` — Delete Attribute Group — /attribute-groups/delete-attribute-group
- `GET /v1/attributes/` — Attributes List — /attributes/attributes-list
- `GET /v1/attributes/{{attribute_id}}` — Atrribute Detail — /attributes/atrribute-detail
- `GET /v1/attributes/grouped` — Attribute List Grouped — /attributes/attribute-list-grouped
- `POST /v1/attributes` — Add Attribute — /attributes/add-attribute
- `PUT /v1/attributes/{{attribute_id}}` — Edit Attribute — /attributes/edit-attribute
- `PATCH /v1/attributes/bulk` — Edit Attribute [BULK] — /attributes/edit-attribute-bulk
- `DELETE /v1/attributes/{{attribute_id}}` — Delete Attribute — /attributes/delete-attribute
- `GET /v1/attributes/{{attribute_id}}/values` — Attributes Values List — /attribute-values/attributes-values-list
- `GET /v1/attributes/{{attribute_id}}/values/{{attribute_value_id}}` — Attribute Values Detail — /attribute-values/attribute-values-detail
- `POST /v1/attributes/{{attribute_id}}/values` — Add Attribute Values — /attribute-values/add-attribute-values
- `PUT /v1/attributes/{{attribute_id}}/values/{{attribute_value_id}}` — Edit Attribute Values — /attribute-values/edit-attribute-values
- `DELETE /v1/attributes/{{attribute_id}}/values/{{attribute_value_id}}` — Delete Attribute Values — /attribute-values/delete-attribute-values
- `GET /v1/addresses` — Addresses List — /addresses/addresses-list
- `POST /v1/addresses` — Add Address — /addresses/add-address
- `PUT /v1/addresses/{{address_id}}` — Edit Address — /addresses/edit-address
- `DELETE /v1/addresses/{{address_id}}` — Delete Address — /addresses/delete-address
- `GET /v1/tenants/languages` — Languages List — /languages/languages-list
- `GET /v1/currencies` — Currencies List — /currencies/currencies-list
- `GET /v1/currencies/{{currency_id}}` — Currency Detail — /currencies/currency-detail
- `POST /v1/currencies` — Add Currency — /currencies/add-currency
- `PUT /v1/currencies/{{currency_id}}` — Edit Currency — /currencies/edit-currency
- `DELETE /v1/currencies/{{currency_id}}` — Delete Currency — /currencies/delete-currency
- `GET /v1/tenants/countries` — Tenant Countries — /tenant-countries
- `GET /v1/media` — Media List — /media/media-list
- `POST /v1/media` — Add Media — /media/add-media
- `DELETE /v1/media/{{media_id}}` — Delete Media — /media/delete-media
- `POST /v1/utils/S3signedUploadURL` — Signed Upload URL — /media/signed-upload-url
- `POST /v1/utils/S3signedGetURL` — Signed Get URL — /media/signed-get-url
- `POST /v1/utils/S3multipart/init` — Multipart Upload Init — /media/multipart-init
- `POST /v1/utils/S3multipart/parts` — Multipart Upload Parts — /media/multipart-parts
- `POST /v1/utils/S3multipart/complete` — Multipart Upload Complete — /media/multipart-complete
- `POST /v1/utils/S3multipart/abort` — Multipart Upload Abort — /media/multipart-abort

## Marketing

- `GET /v1/audiences` — Audiences List — /audiences/audiences-list
- `GET /v1/audiences/{{audience_id}}` — Audience Detail — /audiences/audience-detail
- `POST /v1/audiences` — Create Audience — /audiences/create-audience
- `PUT /v1/audiences/{{audience_id}}` — Update Audience — /audiences/update-audience
- `DELETE /v1/audiences/{{audience_id}}` — Delete Audience — /audiences/delete-audience
- `GET /v1/audiences/{{audience_id}}/members` — Audience Members List — /audiences/audience-members
- `POST /v1/audiences/{{audience_id}}/recalculate` — Recalculate Audience Count — /audiences/recalculate-audience
- `GET /v1/campaigns` — Campaigns List — /campaigns/campaigns-list
- `GET /v1/campaigns/{{campaign_id}}` — Campaign Detail — /campaigns/campaign-detail
- `POST /v1/campaigns` — Create Campaign — /campaigns/create-campaign
- `PUT /v1/campaigns/{{campaign_id}}` — Update Campaign — /campaigns/update-campaign
- `POST /v1/campaigns/{{campaign_id}}/send` — Send Campaign — /campaigns/send-campaign
- `POST /v1/campaigns/{{campaign_id}}/cancel` — Cancel Campaign — /campaigns/cancel-campaign
- `GET /v1/campaigns/{{campaign_id}}/recipients` — Campaign Recipients List — /campaigns/campaign-recipients
- `GET /v1/campaigns/{{campaign_id}}/analytics` — Campaign Analytics — /campaigns/campaign-analytics
- `GET /v1/forms` — Forms List — /forms/forms-list
- `GET /v1/forms/{{form_id}}` — Form Detail — /forms/form-detail
- `POST /v1/forms` — Add Form — /forms/add-form
- `PUT /v1/forms/{{form_id}}` — Edit Form — /forms/edit-form
- `DELETE /v1/forms/{{form_id}}` — Delete Form — /forms/delete-form
- `POST /v1/forms/{{form_id}}/submissions` — Submit Form — /forms/submit-form
- `GET /v1/forms/{{form_id}}/submissions` — Form Submissions List — /forms/form-submissions-list
- `GET /v1/forms/submissions/{{submission_id}}` — Submission Detail — /forms/submission-detail
- `GET /v1/lists` — Lists List — /lists/lists-list
- `POST /v1/lists` — Create List — /lists/create-list
- `PATCH /v1/lists/{{list_id}}` — Update List — /lists/update-list
- `DELETE /v1/lists/{{list_id}}` — Delete List — /lists/delete-list
- `POST /v1/lists/{{list_id}}/members` — Add Members — /lists/add-members
- `POST /v1/lists/{{list_id}}/import` — Import Members from CSV — /lists/import-members
- `GET /v1/lists/{{list_id}}/members` — List Members — /lists/list-members
- `DELETE /v1/lists/{{list_id}}/members` — Remove Members — /lists/remove-members
- `GET /v1/lists/{{list_id}}/analytics` — List Analytics — /lists/list-analytics
- `POST /v1/utils/email` — Send Email — /email-utilities/send-email
- `GET /v1/utils/sent_emails` — Sent Emails — /email-utilities/sent-emails
- `GET /v1/utils/email_analytics` — Email Analytics — /email-utilities/email-analytics
- `GET /v1/utils/emails/analytics/batch` — Batch Email Analytics — /email-utilities/batch-email-analytics
- `GET /v1/utils/email_types` — Email Types — /email-utilities/email-types
- `GET /v1/utils/email/default-template` — Default Email Template — /email-utilities/default-template

## Webhooks

- `GET /v1/webhooks` — Webhook List — /webhook-list
- `GET /v1/webhooks/{{webhook_id}}` — Webhook Detail — /webhook-detail
- `POST /v1/webhooks` — Add Webhook — /add-webhook
- `PATCH /v1/webhooks/{{webhook_id}}` — Edit Webhook — /edit-webhook
- `DELETE /v1/webhooks/{{webhook_id}}` — Delete Webhook — /delete-webhook
- `GET /v1/webhooks/logs` — Webhook Logs — /webhook-logs

## Layers(CMS)

- `GET /v1/layers` — Layer List — /layer-list
- `GET /v1/layers/{{layer_id}}` — Layer Detail — /layer-detail
- `POST /v1/layers` — Create Layer — /create-layer
- `PATCH /v1/layers/{{layer_id}}` — Edit Layer — /edit-layer
- `DELETE /v1/layers/{{layer_id}}` — Delete Layer — /delete-layer

## Subscriptions

- `GET /v1/subscription_products` — Subscriptions — /subscriptions
- `POST /v1/subscription_products` — Subscriptions — /subscriptions
- `GET /v1/subscription_products/stats` — Subscriptions — /subscriptions
- `GET /v1/subscription_products/:id` — Subscriptions — /subscriptions
- `PUT /v1/subscription_products/:id` — Subscriptions — /subscriptions
- `DELETE /v1/subscription_products/:id` — Subscriptions — /subscriptions
- `GET /v1/subscription_products/:id/stats` — Subscriptions — /subscriptions
- `GET /v1/subscription_products/:id/subscribers` — Subscriptions — /subscriptions
- `GET /v1/subscription_products/:id/invoices` — Subscriptions — /subscriptions
- `GET /v1/subscription_products/:id/revenue` — Subscriptions — /subscriptions
- `GET /v1/subscriptions/subscribe/products` — Subscriptions — /subscriptions
- `POST /v1/subscriptions/subscribe` — Subscriptions — /subscriptions
- `POST /v1/subscriptions/subscribe/confirm` — Subscriptions — /subscriptions
- `POST /v1/subscriptions/email_trigger` — Subscriptions — /subscriptions
- `DELETE /v1/subscriptions/unsubscribe` — Subscriptions — /subscriptions
- `GET /v1/subscriptions/subscribe/manage` — Subscriptions — /subscriptions

## Memberships

- `GET /v1/memberships` — Memberships List — /memberships/memberships-list
- `POST /v1/memberships` — Create Membership — /memberships/create-membership
- `GET /v1/memberships/:membership_id` — Membership Detail — /memberships/membership-detail
- `POST /v1/memberships/:membership_id/contributions` — Record Contribution — /memberships/record-contribution
- `GET /v1/memberships/price_logs` — Price Logs List — /memberships/price-logs-list
- `POST /v1/memberships/price_logs` — Create Price Log — /memberships/create-price-log

## Inventory Operations

- `GET /v1/inventory/locations` — List Locations — /inventory/list-locations
- `POST /v1/inventory/locations` — Create Location — /inventory/create-location
- `PUT /v1/inventory/locations/:location_id` — Update Location — /inventory/update-location
- `GET /v1/inventory/stock` — Stock — /inventory/stock
- `PUT /v1/inventory/stock/:stock_id` — Update Stock Settings — /inventory/update-stock
- `GET /v1/inventory/low-stock` — Low Stock — /inventory/low-stock
- `POST /v1/inventory/adjust` — Stock Adjustment — /inventory/adjust
- `GET /v1/inventory/movements` — Movements — /inventory/movements
- `GET /v1/inventory/batches` — List Batches — /inventory/list-batches
- `GET /v1/inventory/batches/expiring` — Expiring Batches — /inventory/expiring-batches
- `POST /v1/inventory/batches` — Create Batch — /inventory/create-batch
- `PUT /v1/inventory/batches/:batch_id` — Update Batch — /inventory/update-batch
- `GET /v1/inventory/lookup` — Barcode Lookup — /inventory/lookup
- `GET /v1/inventory/fda-lookup` — FDA Product Lookup — /inventory/fda-lookup

## Receive Delivery

- `GET /v1/inventory/grn` — List Goods Receipt Notes — /inventory/list-grn
- `POST /v1/inventory/grn` — Create Goods Receipt Note — /inventory/create-grn
- `GET /v1/inventory/grn/:grn_id` — Get Goods Receipt Note — /inventory/get-grn
- `PUT /v1/inventory/grn/:grn_id` — Update Goods Receipt Note — /inventory/update-grn
- `POST /v1/inventory/grn/:grn_id/boxes` — Add Box to GRN — /inventory/add-grn-box
- `GET /v1/inventory/grn/boxes/scan` — Scan GRN Box — /inventory/scan-grn-box
- `PUT /v1/inventory/grn/boxes/:box_id/receive` — Receive GRN Box — /inventory/receive-grn-box

## Receive Transfer

- `GET /v1/inventory/transfers` — List Transfers — /inventory/list-transfers
- `GET /v1/inventory/transfers/:transfer_id` — Get Transfer — /inventory/get-transfer
- `POST /v1/inventory/transfers` — Create Transfer — /inventory/create-transfer
- `PUT /v1/inventory/transfers/:transfer_id/receive` — Receive Transfer — /inventory/receive-transfer
- `PUT /v1/inventory/transfers/:transfer_id/cancel` — Cancel Transfer — /inventory/cancel-transfer
- `GET /v1/inventory/purchase-orders` — List Purchase Orders — /inventory/list-purchase-orders
- `POST /v1/inventory/purchase-orders` — Create Purchase Order — /inventory/create-purchase-order
- `PUT /v1/inventory/purchase-orders/:po_id` — Update Purchase Order — /inventory/update-purchase-order
- `POST /v1/inventory/purchase-orders/:po_id/receive` — Receive Purchase Order — /inventory/receive-purchase-order
