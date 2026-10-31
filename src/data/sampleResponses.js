/*
 * Sample replies of the POST requests (channel=pos), captured from the backend with the docs'
 * default bodies on a test store set up like the real one (Acadex: store admin zayan@acadex.co, id 1,
 * PIN 1111; license LIC-0931-3965-76DF-21E2). Tokens are replaced with "<token>".
 * Regenerate after a response format changes.
 */
export const SAMPLE_RESPONSES = {
  "license-validate": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "New Device registered",
      "data": {
        "license_key": "LIC-0931-3965-76DF-21E2",
        "device_id": 1,
        "status": "trial",
        "starts_at": "2026-10-31T09:27:35.000Z",
        "expires_at": "2026-11-03T09:27:35.000Z",
        "already_registered": false,
        "suspended_at": null,
        "suspended_reason": null,
        "valid": true,
        "planId": 1
      }
    }
  }],
  "location-create": [{
    "label": "201 Created",
    "status": 201,
    "body": {
      "success": true,
      "message": "Location Successfully Created",
      "data": {
        "id": 3,
        "store_number": 1,
        "name": "Gulshan e Iqbal Block 2",
        "address_line": "Shop # 12, Main University Road, Gulshan e Iqbal Block 2, Karachi",
        "city": "Karachi",
        "country": "PK",
        "postal_code": null,
        "phone": "03001234567",
        "is_default": false,
        "is_active": true,
        "manager": null,
        "created_at": "2026-10-31T09:27:35.314Z",
        "updated_at": "2026-10-31T09:27:35.314Z"
      }
    }
  }],
  "staff-bulk": [{
    "label": "201 Created",
    "status": 201,
    "body": {
      "success": true,
      "message": "Staff Successfully Created",
      "data": [
        {
          "id": 2,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "name": "Ahmed Malik",
          "email": "ahmed@acadex.co",
          "pin": "2222",
          "role": "manager",
          "phone": null,
          "is_active": true
        },
        {
          "id": 3,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "name": "Ameer Hamza",
          "email": "ameer@acadex.co",
          "pin": "3333",
          "role": "cashier",
          "phone": null,
          "is_active": true
        },
        {
          "id": 4,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "name": "Yasir Ali Khan",
          "email": "yasir@acadex.co",
          "pin": "4444",
          "role": "cashier",
          "phone": null,
          "is_active": true
        }
      ]
    }
  }],
  "auth-login": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Successfully Login",
      "data": {
        "token": "<token>",
        "user": {
          "id": 1,
          "name": "Zayan Ahmed",
          "email": "zayan@acadex.co",
          "pin": "1111",
          "role": "store_admin",
          "phone": "03162196345",
          "is_active": true
        },
        "store": {
          "id": 1,
          "name": "Acadex",
          "status": "trial",
          "trial_ended_at": "2026-11-03T09:27:34.000Z"
        },
        "locations": [
          {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D",
            "address": "Shop # 432 Allama rasheed main rashid Minhas road Gulshan e Iqbal Block 13 D Karachi"
          },
          {
            "id": 2,
            "name": "Branch 2",
            "address": "Shop 5, Mall Road"
          },
          {
            "id": 3,
            "name": "Gulshan e Iqbal Block 2",
            "address": "Shop # 12, Main University Road, Gulshan e Iqbal Block 2, Karachi"
          }
        ],
        "users": [
          {
            "id": 2,
            "locationId": 1,
            "name": "Ahmed Malik",
            "email": "ahmed@acadex.co",
            "pin": "2222",
            "role": "manager",
            "phone": null,
            "is_active": true
          },
          {
            "id": 3,
            "locationId": 1,
            "name": "Ameer Hamza",
            "email": "ameer@acadex.co",
            "pin": "3333",
            "role": "cashier",
            "phone": null,
            "is_active": true
          },
          {
            "id": 4,
            "locationId": 1,
            "name": "Yasir Ali Khan",
            "email": "yasir@acadex.co",
            "pin": "4444",
            "role": "cashier",
            "phone": null,
            "is_active": true
          }
        ]
      }
    }
  }],
  "auth-pin-verify": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "PIN Verify Successfully",
      "data": {
        "id": 2,
        "name": "Ahmed Malik",
        "email": "ahmed@acadex.co",
        "pin": "2222",
        "role": "manager",
        "phone": null,
        "is_active": true
      }
    }
  }],
  "staff-clock-in": [{
    "label": "201 Created",
    "status": 201,
    "body": {
      "success": true,
      "message": "Clock In Session",
      "data": [
        {
          "id": 1,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "status": "clock_in",
          "opening_at": "2026-10-24T09:00:00.000Z"
        }
      ]
    }
  }],
  "batch-open": [{
    "label": "201 Created",
    "status": 201,
    "body": {
      "success": true,
      "message": "Batch Open",
      "data": [
        {
          "id": 1,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "opening_amount": 5000,
          "opening_at": "2026-10-24T09:00:00.000Z"
        }
      ]
    }
  }],
  "cat-bulk": [{
    "label": "201 Created",
    "status": 201,
    "body": {
      "success": true,
      "message": "Categories Created",
      "data": [
        {
          "id": 1,
          "name": "Beverages",
          "slug": "beverages",
          "parent": null,
          "image_url": null,
          "description": null,
          "tax_type": "percentage",
          "tax_value": 5,
          "tax_name": "GST",
          "discount_type": "percentage",
          "discount_value": 5,
          "discount_name": "Eid Shopping",
          "is_active": true
        },
        {
          "id": 2,
          "name": "Soap",
          "slug": "soap",
          "parent": null,
          "image_url": null,
          "description": null,
          "tax_type": "percentage",
          "tax_value": 10,
          "tax_name": "GST",
          "discount_type": "percentage",
          "discount_value": 0,
          "discount_name": "Eid Shopping",
          "is_active": true
        },
        {
          "id": 3,
          "name": "Rice & Daal",
          "slug": "rice-daal",
          "parent": null,
          "image_url": null,
          "description": null,
          "tax_type": "percentage",
          "tax_value": 0,
          "tax_name": "GST",
          "discount_type": "percentage",
          "discount_value": 10,
          "discount_name": "Eid Shopping",
          "is_active": true
        }
      ]
    }
  }],
  "prod-bulk": [{
    "label": "201 Created",
    "status": 201,
    "body": {
      "success": true,
      "message": "Products Created",
      "data": [
        {
          "id": 1,
          "title": "1 Litre Pepsi",
          "slug": "1-litre-pepsi",
          "category": {
            "id": 1,
            "name": "Beverages"
          },
          "sku": "1-LITRE-PEPSI",
          "barcode": "78263672323325",
          "image": null,
          "description": null,
          "unit": "bottle",
          "cost_price": 50,
          "selling_price": 100,
          "has_product_discount": true,
          "discount_type": "percentage",
          "discount_value": 5,
          "discount_name": "Eid Shopping",
          "has_product_tax": true,
          "taxes": [
            {
              "name": "GST",
              "type": "percentage",
              "value": 18
            }
          ],
          "is_pack_product": false,
          "pack_size": null,
          "pack_cost_price": null,
          "pack_selling_price": null,
          "sell_loose": true,
          "is_weight_based": false,
          "has_bulk_discount": false,
          "low_stock_threshold": 10,
          "total_price_each_unit": 112.1,
          "total_pack_price": null,
          "is_active": true,
          "is_pos_visible": true,
          "is_web_visible": true
        },
        {
          "id": 2,
          "title": "Lux Soap",
          "slug": "lux-soap",
          "category": {
            "id": 2,
            "name": "Soap"
          },
          "sku": "LUX-SOAP",
          "barcode": "8961014001234",
          "image": null,
          "description": null,
          "unit": "piece",
          "cost_price": 75,
          "selling_price": 100,
          "has_product_discount": true,
          "discount_type": "percentage",
          "discount_value": 0,
          "discount_name": "Eid Shopping",
          "has_product_tax": true,
          "taxes": [
            {
              "name": "GST",
              "type": "percentage",
              "value": 18
            }
          ],
          "is_pack_product": true,
          "pack_size": 12,
          "pack_cost_price": 900,
          "pack_selling_price": 1200,
          "sell_loose": true,
          "is_weight_based": false,
          "has_bulk_discount": false,
          "low_stock_threshold": 10,
          "total_price_each_unit": 118,
          "total_pack_price": 1416,
          "is_active": true,
          "is_pos_visible": true,
          "is_web_visible": true
        },
        {
          "id": 3,
          "title": "Basmati Rice",
          "slug": "basmati-rice",
          "category": {
            "id": 3,
            "name": "Rice & Daal"
          },
          "sku": "BASMATI-RICE",
          "barcode": "8964000123456",
          "image": null,
          "description": null,
          "unit": "kg",
          "cost_price": 300,
          "selling_price": 360,
          "has_product_discount": true,
          "discount_type": "percentage",
          "discount_value": 10,
          "discount_name": "Eid Shopping",
          "has_product_tax": true,
          "taxes": [
            {
              "name": "GST",
              "type": "percentage",
              "value": 18
            },
            {
              "name": "Excise",
              "type": "fixed",
              "value": 2
            }
          ],
          "is_pack_product": true,
          "pack_size": 25,
          "pack_cost_price": 7500,
          "pack_selling_price": 9000,
          "sell_loose": true,
          "is_weight_based": true,
          "has_bulk_discount": false,
          "low_stock_threshold": 10,
          "total_price_each_unit": 384.32,
          "total_pack_price": 9608,
          "is_active": true,
          "is_pos_visible": true,
          "is_web_visible": true
        }
      ]
    }
  }],
  "movement-bulk": [{
    "label": "201 Created",
    "status": 201,
    "body": {
      "success": true,
      "message": "Stock Movement Created",
      "data": [
        {
          "id": 1,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "supplier": null,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "order": null,
          "movement_type": "stock_in",
          "reason": "purchase",
          "reason_note": null,
          "qty": 50,
          "qty_after": 50,
          "unit_sold": 0,
          "created_at": "2026-10-31T09:27:35.000Z"
        },
        {
          "id": 2,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "product": {
            "id": 2,
            "title": "Lux Soap",
            "sku": "LUX-SOAP",
            "unit": "piece"
          },
          "supplier": null,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "order": null,
          "movement_type": "stock_in",
          "reason": "opening_balance",
          "reason_note": null,
          "qty": 24,
          "qty_after": 24,
          "unit_sold": 0,
          "created_at": "2026-10-31T09:27:35.000Z"
        },
        {
          "id": 3,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "supplier": null,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "order": null,
          "movement_type": "stock_out",
          "reason": "damage",
          "reason_note": null,
          "qty": -2,
          "qty_after": 48,
          "unit_sold": 0,
          "created_at": "2026-10-31T09:27:35.000Z"
        }
      ]
    }
  }],
  "transfer-bulk": [{
    "label": "201 Created",
    "status": 201,
    "body": {
      "success": true,
      "message": "Stock Transfer Created",
      "data": [
        {
          "id": 1,
          "from_location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "to_location": {
            "id": 2,
            "name": "Branch 2"
          },
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "qty": 20,
          "received_qty": null,
          "status": "on_the_way",
          "note": "Weekly refill",
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "created_at": "2026-10-31T09:27:35.891Z"
        },
        {
          "id": 2,
          "from_location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "to_location": {
            "id": 2,
            "name": "Branch 2"
          },
          "product": {
            "id": 2,
            "title": "Lux Soap",
            "sku": "LUX-SOAP",
            "unit": "piece"
          },
          "qty": 12,
          "received_qty": null,
          "status": "on_the_way",
          "note": null,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "created_at": "2026-10-31T09:27:35.899Z"
        },
        {
          "id": 3,
          "from_location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "to_location": {
            "id": 2,
            "name": "Branch 2"
          },
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "qty": 10,
          "received_qty": null,
          "status": "on_the_way",
          "note": "Weekend stock",
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "created_at": "2026-10-31T09:27:35.907Z"
        }
      ]
    }
  }],
  "offer-bulk": [{
    "label": "201 Created",
    "status": 201,
    "body": {
      "success": true,
      "message": "Offer Created",
      "data": [
        {
          "id": 1,
          "type": "promotional",
          "name": "Weekend 10% off",
          "apply_to": "category",
          "category": {
            "id": 1,
            "name": "Beverages"
          },
          "discount_type": "percentage",
          "discount_value": 10,
          "promo_price": null,
          "free_product": null,
          "start_at": "2026-09-01T00:00:00.000Z",
          "end_at": "2026-12-31T23:59:59.000Z",
          "min_qty": null,
          "buy_qty": null,
          "get_qty": null,
          "location_scope": "all",
          "locations": [],
          "is_active": true,
          "status": "active",
          "staff": {
            "id": 1,
            "name": "Zayan Ahmed",
            "role": "store_admin"
          }
        },
        {
          "id": 2,
          "type": "bulk_discount",
          "name": "Buy 3 save 5%",
          "apply_to": "product",
          "product": {
            "id": 2,
            "title": "Lux Soap",
            "sku": "LUX-SOAP",
            "unit": "piece"
          },
          "discount_type": "percentage",
          "discount_value": 5,
          "promo_price": null,
          "free_product": null,
          "start_at": "2026-09-01T00:00:00.000Z",
          "end_at": "2026-12-31T23:59:59.000Z",
          "min_qty": 3,
          "buy_qty": null,
          "get_qty": null,
          "location_scope": "selected",
          "locations": [
            {
              "id": 1,
              "name": "Gulshan e Iqbal Block 13 D"
            }
          ],
          "is_active": true,
          "status": "active",
          "staff": {
            "id": 1,
            "name": "Zayan Ahmed",
            "role": "store_admin"
          }
        },
        {
          "id": 3,
          "type": "bogo",
          "name": "Buy 2 get 1 free",
          "apply_to": "product",
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "discount_type": null,
          "discount_value": null,
          "promo_price": null,
          "free_product": null,
          "start_at": "2026-09-01T00:00:00.000Z",
          "end_at": "2026-12-31T23:59:59.000Z",
          "min_qty": null,
          "buy_qty": 2,
          "get_qty": 1,
          "location_scope": "selected",
          "locations": [
            {
              "id": 1,
              "name": "Gulshan e Iqbal Block 13 D"
            }
          ],
          "is_active": true,
          "status": "active",
          "staff": {
            "id": 1,
            "name": "Zayan Ahmed",
            "role": "store_admin"
          }
        }
      ]
    }
  }],
  "sup-bulk": [{
    "label": "201 Created",
    "status": 201,
    "body": {
      "success": true,
      "message": "Supplier Created",
      "data": [
        {
          "id": 1,
          "location_scope": "all",
          "locations": [],
          "name": "Nestle Distributor",
          "email": "sales@nestle-dist.local",
          "phone": "03006666666",
          "payment_terms": "Net 15",
          "address": "Industrial Area",
          "is_active": true
        },
        {
          "id": 2,
          "location_scope": "selected",
          "locations": [
            {
              "id": 1,
              "name": "Gulshan e Iqbal Block 13 D"
            }
          ],
          "name": "Unilever Wholesale",
          "email": "orders@unilever-ws.local",
          "phone": "03007777777",
          "payment_terms": "Net 30",
          "address": "Korangi",
          "is_active": true
        },
        {
          "id": 3,
          "location_scope": "selected",
          "locations": [
            {
              "id": 1,
              "name": "Gulshan e Iqbal Block 13 D"
            }
          ],
          "name": "Rice Mills Co",
          "email": "info@ricemills.local",
          "phone": "03008888888",
          "payment_terms": "Cash on delivery",
          "address": "Gujranwala",
          "is_active": true
        }
      ]
    }
  }],
  "order-bulk": [{
    "label": "201 Created",
    "status": 201,
    "body": {
      "success": true,
      "message": "Order Created",
      "data": [
        {
          "id": 1,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "is_custom": false,
          "offer_exempt": false,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "customer": null,
          "batch": {
            "id": 1,
            "status": "open"
          },
          "currency": "PKR",
          "order_items": [
            {
              "id": 1,
              "product": {
                "id": 1,
                "title": "1 Litre Pepsi",
                "sku": "1-LITRE-PEPSI",
                "unit": "bottle"
              },
              "category": {
                "id": 1,
                "name": "Beverages"
              },
              "qty": 2,
              "unit_price": 100,
              "discount_amount": 20,
              "subtotal": 180,
              "tax_amount": 73.8,
              "total": 253.8,
              "discount_source": "offer",
              "offers": [
                {
                  "id": 1,
                  "name": "Weekend 10% off",
                  "type": "promotional",
                  "amount": 20,
                  "buy_qty": null,
                  "get_qty": null,
                  "min_qty": null,
                  "promo_price": null,
                  "discount_type": "percentage",
                  "discount_value": 10
                }
              ],
              "free_qty": 0
            },
            {
              "id": 2,
              "product": {
                "id": 2,
                "title": "Lux Soap",
                "sku": "LUX-SOAP",
                "unit": "piece"
              },
              "category": {
                "id": 2,
                "name": "Soap"
              },
              "qty": 1,
              "unit_price": 100,
              "discount_amount": 0,
              "subtotal": 100,
              "tax_amount": 46,
              "total": 146,
              "discount_source": "none",
              "offers": [],
              "free_qty": 0
            }
          ],
          "subtotal": 349.4,
          "is_order_discounted": false,
          "order_discount_type": null,
          "discount_amount": 0,
          "payment_method": "cash",
          "payment_status": "paid",
          "payment_gst_amount": 63.97,
          "tax_amount": 183.77,
          "payments": [
            {
              "method": "cash",
              "bill_share": 399.8,
              "payment_tax_percent": 16,
              "payment_tax_amount": 63.97,
              "amount": 463.77,
              "paid": 1000,
              "change": 536.23
            }
          ],
          "fbr_invoice_enabled": false,
          "fbr_tax_amount": 0,
          "order_status": "completed",
          "total_amount": 463.77,
          "amount_paid": 1000,
          "change_due": 536.23,
          "remaining_amount": 0,
          "cancel_reason": null,
          "cancelled_by": null,
          "placed_at": "2026-10-24T10:05:00.000Z",
          "channel": "pos",
          "is_pos_visible": true,
          "is_web_visible": false
        },
        {
          "id": 2,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "is_custom": true,
          "offer_exempt": false,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "customer": null,
          "batch": {
            "id": 1,
            "status": "open"
          },
          "currency": "PKR",
          "order_items": [
            {
              "id": 1,
              "category": "Stationary",
              "title": "SP10 Blue Pen",
              "price": 50,
              "qty": 2,
              "unit_price": 50,
              "discount_amount": 0,
              "subtotal": 100,
              "tax_amount": 18,
              "total": 118
            },
            {
              "id": 2,
              "category": "Stationary",
              "title": "A4 Notebook",
              "price": 120,
              "qty": 1,
              "unit_price": 120,
              "discount_amount": 0,
              "subtotal": 120,
              "tax_amount": 21.6,
              "total": 141.6
            }
          ],
          "subtotal": 220,
          "is_order_discounted": false,
          "order_discount_type": null,
          "discount_amount": 0,
          "payment_method": "cash",
          "payment_status": "paid",
          "payment_gst_amount": 41.54,
          "tax_amount": 81.14,
          "payments": [
            {
              "method": "cash",
              "bill_share": 259.6,
              "payment_tax_percent": 16,
              "payment_tax_amount": 41.54,
              "amount": 301.14,
              "paid": 500,
              "change": 198.86
            }
          ],
          "fbr_invoice_enabled": false,
          "fbr_tax_amount": 0,
          "order_status": "completed",
          "total_amount": 301.14,
          "amount_paid": 500,
          "change_due": 198.86,
          "remaining_amount": 0,
          "cancel_reason": null,
          "cancelled_by": null,
          "placed_at": "2026-10-24T10:20:00.000Z",
          "channel": "pos",
          "is_pos_visible": true,
          "is_web_visible": false
        },
        {
          "id": 3,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "is_custom": false,
          "offer_exempt": false,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "customer": null,
          "batch": {
            "id": 1,
            "status": "open"
          },
          "currency": "PKR",
          "order_items": [
            {
              "id": 1,
              "product": {
                "id": 2,
                "title": "Lux Soap",
                "sku": "LUX-SOAP",
                "unit": "piece"
              },
              "category": {
                "id": 2,
                "name": "Soap"
              },
              "qty": 12,
              "unit_price": 100,
              "discount_amount": 60,
              "subtotal": 1140,
              "tax_amount": 524.4,
              "total": 1664.4,
              "discount_source": "offer",
              "offers": [
                {
                  "id": 2,
                  "name": "Buy 3 save 5%",
                  "type": "bulk_discount",
                  "amount": 60,
                  "buy_qty": null,
                  "get_qty": null,
                  "min_qty": 3,
                  "promo_price": null,
                  "discount_type": "percentage",
                  "discount_value": 5
                }
              ],
              "free_qty": 0
            },
            {
              "id": 2,
              "product": {
                "id": 1,
                "title": "1 Litre Pepsi",
                "sku": "1-LITRE-PEPSI",
                "unit": "bottle"
              },
              "category": {
                "id": 1,
                "name": "Beverages"
              },
              "qty": 1,
              "unit_price": 100,
              "discount_amount": 10,
              "subtotal": 90,
              "tax_amount": 36.9,
              "total": 126.9,
              "discount_source": "offer",
              "offers": [
                {
                  "id": 1,
                  "name": "Weekend 10% off",
                  "type": "promotional",
                  "amount": 10,
                  "buy_qty": null,
                  "get_qty": null,
                  "min_qty": null,
                  "promo_price": null,
                  "discount_type": "percentage",
                  "discount_value": 10
                }
              ],
              "free_qty": 0
            }
          ],
          "subtotal": 1569.9,
          "is_order_discounted": false,
          "order_discount_type": null,
          "discount_amount": 0,
          "payment_method": "mixed",
          "payment_status": "paid",
          "payment_gst_amount": 276.13,
          "tax_amount": 837.43,
          "payments": [
            {
              "method": "card",
              "bill_share": 95.24,
              "payment_tax_percent": 5,
              "payment_tax_amount": 4.76,
              "amount": 100,
              "paid": 100,
              "change": 0
            },
            {
              "method": "cash",
              "bill_share": 1696.06,
              "payment_tax_percent": 16,
              "payment_tax_amount": 271.37,
              "amount": 1967.43,
              "paid": 3000,
              "change": 1032.57
            }
          ],
          "fbr_invoice_enabled": false,
          "fbr_tax_amount": 0,
          "order_status": "completed",
          "total_amount": 2067.43,
          "amount_paid": 3100,
          "change_due": 1032.57,
          "remaining_amount": 0,
          "cancel_reason": null,
          "cancelled_by": null,
          "placed_at": "2026-10-24T11:40:00.000Z",
          "channel": "pos",
          "is_pos_visible": true,
          "is_web_visible": false
        },
        {
          "id": 4,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "is_custom": true,
          "offer_exempt": false,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "customer": null,
          "batch": {
            "id": 1,
            "status": "open"
          },
          "currency": "PKR",
          "order_items": [
            {
              "id": 1,
              "category": "Household",
              "title": "Tissue Box",
              "price": 150,
              "qty": 1,
              "unit_price": 150,
              "discount_amount": 0,
              "subtotal": 150,
              "tax_amount": 27,
              "total": 177
            },
            {
              "id": 2,
              "category": "Electronics",
              "title": "AA Batteries (pair)",
              "price": 80,
              "qty": 2,
              "unit_price": 80,
              "discount_amount": 0,
              "subtotal": 160,
              "tax_amount": 28.8,
              "total": 188.8
            }
          ],
          "subtotal": 310,
          "is_order_discounted": false,
          "order_discount_type": null,
          "discount_amount": 0,
          "payment_method": "mixed",
          "payment_status": "paid",
          "payment_gst_amount": 53.29,
          "tax_amount": 109.09,
          "payments": [
            {
              "method": "jazzcash",
              "bill_share": 47.62,
              "payment_tax_percent": 5,
              "payment_tax_amount": 2.38,
              "amount": 50,
              "paid": 50,
              "change": 0
            },
            {
              "method": "cash",
              "bill_share": 318.18,
              "payment_tax_percent": 16,
              "payment_tax_amount": 50.91,
              "amount": 369.09,
              "paid": 500,
              "change": 130.91
            }
          ],
          "fbr_invoice_enabled": false,
          "fbr_tax_amount": 0,
          "order_status": "completed",
          "total_amount": 419.09,
          "amount_paid": 550,
          "change_due": 130.91,
          "remaining_amount": 0,
          "cancel_reason": null,
          "cancelled_by": null,
          "placed_at": "2026-10-24T12:15:00.000Z",
          "channel": "pos",
          "is_pos_visible": true,
          "is_web_visible": false
        },
        {
          "id": 5,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "is_custom": false,
          "offer_exempt": false,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "customer": null,
          "batch": {
            "id": 1,
            "status": "open"
          },
          "currency": "PKR",
          "order_items": [
            {
              "id": 1,
              "product": {
                "id": 1,
                "title": "1 Litre Pepsi",
                "sku": "1-LITRE-PEPSI",
                "unit": "bottle"
              },
              "category": {
                "id": 1,
                "name": "Beverages"
              },
              "qty": 3,
              "unit_price": 100,
              "discount_amount": 100,
              "subtotal": 200,
              "tax_amount": 82,
              "total": 282,
              "discount_source": "offer",
              "offers": [
                {
                  "id": 3,
                  "name": "Buy 2 get 1 free",
                  "type": "bogo",
                  "amount": 100,
                  "buy_qty": 2,
                  "get_qty": 1,
                  "min_qty": null,
                  "promo_price": null,
                  "discount_type": null,
                  "discount_value": null
                }
              ],
              "free_qty": 1
            },
            {
              "id": 2,
              "product": {
                "id": 2,
                "title": "Lux Soap",
                "sku": "LUX-SOAP",
                "unit": "piece"
              },
              "category": {
                "id": 2,
                "name": "Soap"
              },
              "qty": 2,
              "unit_price": 100,
              "discount_amount": 0,
              "subtotal": 200,
              "tax_amount": 92,
              "total": 292,
              "discount_source": "none",
              "offers": [],
              "free_qty": 0
            }
          ],
          "subtotal": 502,
          "is_order_discounted": false,
          "order_discount_type": null,
          "discount_amount": 0,
          "payment_method": "mixed",
          "payment_status": "paid",
          "payment_gst_amount": 80.12,
          "tax_amount": 254.12,
          "payments": [
            {
              "method": "easypaisa",
              "bill_share": 106.55,
              "payment_tax_percent": 5,
              "payment_tax_amount": 5.33,
              "amount": 111.88,
              "paid": 111.88,
              "change": 0
            },
            {
              "method": "cash",
              "bill_share": 467.45,
              "payment_tax_percent": 16,
              "payment_tax_amount": 74.79,
              "amount": 542.24,
              "paid": 1000,
              "change": 457.76
            }
          ],
          "fbr_invoice_enabled": false,
          "fbr_tax_amount": 0,
          "order_status": "completed",
          "total_amount": 654.12,
          "amount_paid": 1111.88,
          "change_due": 457.76,
          "remaining_amount": 0,
          "cancel_reason": null,
          "cancelled_by": null,
          "placed_at": "2026-10-24T13:30:00.000Z",
          "channel": "pos",
          "is_pos_visible": true,
          "is_web_visible": false
        }
      ]
    }
  }],
  "order-refund-complete-bulk": [{
    "label": "201 Created",
    "status": 201,
    "body": {
      "success": true,
      "message": "Refunded Successfully",
      "data": [
        {
          "id": 1,
          "refund_type": "complete",
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "order": {
            "id": 2,
            "status": "refunded"
          },
          "receiptId": 6,
          "currency": "PKR",
          "reason": "Full return",
          "items": [
            {
              "order_item_id": 1,
              "title": "SP10 Blue Pen",
              "qty": 2,
              "unit_price": 50,
              "amount": 100,
              "tax": 36.88
            },
            {
              "order_item_id": 2,
              "title": "A4 Notebook",
              "qty": 1,
              "unit_price": 120,
              "amount": 120,
              "tax": 44.26
            }
          ],
          "amount": 220,
          "tax": 81.14,
          "total": 301.14,
          "payments": [
            {
              "amount": 136.88,
              "method": "cash",
              "bill_share": 118,
              "payment_tax_amount": 18.88,
              "payment_tax_percent": 16
            }
          ],
          "refunded_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 3,
          "refund_type": "complete",
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "order": {
            "id": 3,
            "status": "refunded"
          },
          "receiptId": 8,
          "currency": "PKR",
          "reason": "Customer changed mind",
          "items": [
            {
              "order_item_id": 1,
              "product": {
                "id": 2,
                "title": "Lux Soap",
                "sku": "LUX-SOAP",
                "unit": "piece"
              },
              "qty": 12,
              "unit_price": 100,
              "amount": 1140,
              "tax": 780.97
            },
            {
              "order_item_id": 2,
              "product": {
                "id": 1,
                "title": "1 Litre Pepsi",
                "sku": "1-LITRE-PEPSI",
                "unit": "bottle"
              },
              "qty": 1,
              "unit_price": 100,
              "amount": 90,
              "tax": 56.46
            }
          ],
          "amount": 1230,
          "tax": 837.43,
          "total": 2067.43,
          "payments": [
            {
              "amount": 92.92,
              "method": "card",
              "bill_share": 88.5,
              "payment_tax_amount": 4.42,
              "payment_tax_percent": 5
            },
            {
              "amount": 1828.05,
              "method": "cash",
              "bill_share": 1575.91,
              "payment_tax_amount": 252.14,
              "payment_tax_percent": 16
            }
          ],
          "refunded_at": "2026-10-31T09:27:36.000Z"
        }
      ]
    }
  }],
  "order-refund-bulk": [{
    "label": "201 Created",
    "status": 201,
    "body": {
      "success": true,
      "message": "Refunded Successfully",
      "data": [
        {
          "id": 5,
          "refund_type": "partial",
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "order": {
            "id": 1,
            "status": "partial_refunded"
          },
          "receiptId": 10,
          "currency": "PKR",
          "reason": "Customer return",
          "items": [
            {
              "order_item_id": 1,
              "product": {
                "id": 1,
                "title": "1 Litre Pepsi",
                "sku": "1-LITRE-PEPSI",
                "unit": "bottle"
              },
              "qty": 1,
              "unit_price": 100,
              "amount": 90,
              "tax": 57.2
            }
          ],
          "amount": 90,
          "tax": 57.2,
          "total": 147.2,
          "payments": [
            {
              "amount": 147.2,
              "method": "cash",
              "bill_share": 126.9,
              "payment_tax_amount": 20.3,
              "payment_tax_percent": 16
            }
          ],
          "refunded_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 6,
          "refund_type": "partial",
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "order": {
            "id": 1,
            "status": "partial_refunded"
          },
          "receiptId": 11,
          "currency": "PKR",
          "reason": "Damaged item",
          "items": [
            {
              "order_item_id": 2,
              "product": {
                "id": 2,
                "title": "Lux Soap",
                "sku": "LUX-SOAP",
                "unit": "piece"
              },
              "qty": 1,
              "unit_price": 100,
              "amount": 100,
              "tax": 69.37
            }
          ],
          "amount": 100,
          "tax": 69.37,
          "total": 169.37,
          "payments": [
            {
              "amount": 169.37,
              "method": "cash",
              "bill_share": 146.01,
              "payment_tax_amount": 23.36,
              "payment_tax_percent": 16
            }
          ],
          "refunded_at": "2026-10-31T09:27:36.000Z"
        }
      ]
    }
  }],
  "customer-create": [{
    "label": "201 Created",
    "status": 201,
    "body": {
      "success": true,
      "message": "Customer Successfully Created",
      "data": {
        "id": 1,
        "name": "Ali Khan",
        "phone": "03001231234",
        "email": "ali@example.com",
        "location_id": null,
        "total_debt": 0,
        "remaining_debt": 0,
        "debt_notes": null,
        "is_active": true
      }
    }
  }],
  "prod-bulk-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Products Updated",
      "data": [
        {
          "id": 1,
          "title": "1 Litre Pepsi",
          "slug": "1-litre-pepsi",
          "category": {
            "id": 1,
            "name": "Beverages"
          },
          "sku": "1-LITRE-PEPSI",
          "barcode": "78263672323325",
          "image": null,
          "description": null,
          "unit": "bottle",
          "cost_price": 50,
          "selling_price": 110,
          "has_product_discount": true,
          "discount_type": "percentage",
          "discount_value": 10,
          "discount_name": "Eid Shopping",
          "has_product_tax": true,
          "taxes": [
            {
              "name": "GST",
              "type": "percentage",
              "value": 18
            }
          ],
          "is_pack_product": false,
          "pack_size": null,
          "pack_cost_price": null,
          "pack_selling_price": null,
          "sell_loose": true,
          "is_weight_based": false,
          "has_bulk_discount": false,
          "low_stock_threshold": 10,
          "total_price_each_unit": 116.82,
          "total_pack_price": null,
          "is_active": true,
          "is_pos_visible": true,
          "is_web_visible": true
        },
        {
          "id": 2,
          "title": "Lux Soap",
          "slug": "lux-soap",
          "category": {
            "id": 2,
            "name": "Soap"
          },
          "sku": "LUX-SOAP",
          "barcode": "8961014001234",
          "image": null,
          "description": null,
          "unit": "piece",
          "cost_price": 75,
          "selling_price": 100,
          "has_product_discount": true,
          "discount_type": "percentage",
          "discount_value": 0,
          "discount_name": "Eid Shopping",
          "has_product_tax": true,
          "taxes": [
            {
              "name": "GST",
              "type": "percentage",
              "value": 18
            }
          ],
          "is_pack_product": true,
          "pack_size": 12,
          "pack_cost_price": 900,
          "pack_selling_price": 1200,
          "sell_loose": true,
          "is_weight_based": false,
          "has_bulk_discount": false,
          "low_stock_threshold": 24,
          "total_price_each_unit": 118,
          "total_pack_price": 1416,
          "is_active": true,
          "is_pos_visible": true,
          "is_web_visible": true
        }
      ]
    }
  }],
  "prod-bulk-weight-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Weight Settings Updated",
      "data": [
        {
          "id": 3,
          "title": "Basmati Rice",
          "slug": "basmati-rice",
          "category": {
            "id": 3,
            "name": "Rice & Daal"
          },
          "sku": "BASMATI-RICE",
          "barcode": "8964000123456",
          "image": null,
          "description": null,
          "unit": "kg",
          "cost_price": 300,
          "selling_price": 360,
          "has_product_discount": true,
          "discount_type": "percentage",
          "discount_value": 10,
          "discount_name": "Eid Shopping",
          "has_product_tax": true,
          "taxes": [
            {
              "name": "GST",
              "type": "percentage",
              "value": 18
            },
            {
              "name": "Excise",
              "type": "fixed",
              "value": 2
            }
          ],
          "is_pack_product": true,
          "pack_size": 25,
          "pack_cost_price": 7500,
          "pack_selling_price": 9000,
          "sell_loose": true,
          "is_weight_based": true,
          "has_bulk_discount": false,
          "low_stock_threshold": 10,
          "total_price_each_unit": 384.32,
          "total_pack_price": 9608,
          "is_active": true,
          "is_pos_visible": true,
          "is_web_visible": true
        },
        {
          "id": 1,
          "title": "1 Litre Pepsi",
          "slug": "1-litre-pepsi",
          "category": {
            "id": 1,
            "name": "Beverages"
          },
          "sku": "1-LITRE-PEPSI",
          "barcode": "78263672323325",
          "image": null,
          "description": null,
          "unit": "bottle",
          "cost_price": 50,
          "selling_price": 110,
          "has_product_discount": true,
          "discount_type": "percentage",
          "discount_value": 10,
          "discount_name": "Eid Shopping",
          "has_product_tax": true,
          "taxes": [
            {
              "name": "GST",
              "type": "percentage",
              "value": 18
            }
          ],
          "is_pack_product": false,
          "pack_size": null,
          "pack_cost_price": null,
          "pack_selling_price": null,
          "sell_loose": true,
          "is_weight_based": false,
          "has_bulk_discount": false,
          "low_stock_threshold": 10,
          "total_price_each_unit": 116.82,
          "total_pack_price": null,
          "is_active": true,
          "is_pos_visible": true,
          "is_web_visible": true
        }
      ]
    }
  }],
  "prod-bulk-price-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Prices Updated",
      "data": [
        {
          "id": 1,
          "title": "1 Litre Pepsi",
          "slug": "1-litre-pepsi",
          "category": {
            "id": 1,
            "name": "Beverages"
          },
          "sku": "1-LITRE-PEPSI",
          "barcode": "78263672323325",
          "image": null,
          "description": null,
          "unit": "bottle",
          "cost_price": 55,
          "selling_price": 110,
          "has_product_discount": true,
          "discount_type": "percentage",
          "discount_value": 10,
          "discount_name": "Eid Shopping",
          "has_product_tax": true,
          "taxes": [
            {
              "name": "GST",
              "type": "percentage",
              "value": 18
            }
          ],
          "is_pack_product": false,
          "pack_size": null,
          "pack_cost_price": null,
          "pack_selling_price": null,
          "sell_loose": true,
          "is_weight_based": false,
          "has_bulk_discount": false,
          "low_stock_threshold": 10,
          "total_price_each_unit": 116.82,
          "total_pack_price": null,
          "is_active": true,
          "is_pos_visible": true,
          "is_web_visible": true
        },
        {
          "id": 2,
          "title": "Lux Soap",
          "slug": "lux-soap",
          "category": {
            "id": 2,
            "name": "Soap"
          },
          "sku": "LUX-SOAP",
          "barcode": "8961014001234",
          "image": null,
          "description": null,
          "unit": "piece",
          "cost_price": 79.17,
          "selling_price": 105,
          "has_product_discount": true,
          "discount_type": "percentage",
          "discount_value": 0,
          "discount_name": "Eid Shopping",
          "has_product_tax": true,
          "taxes": [
            {
              "name": "GST",
              "type": "percentage",
              "value": 18
            }
          ],
          "is_pack_product": true,
          "pack_size": 12,
          "pack_cost_price": 950,
          "pack_selling_price": 1260,
          "sell_loose": true,
          "is_weight_based": false,
          "has_bulk_discount": false,
          "low_stock_threshold": 24,
          "total_price_each_unit": 123.9,
          "total_pack_price": 1486.8,
          "is_active": true,
          "is_pos_visible": true,
          "is_web_visible": true
        }
      ]
    }
  }],
  "prod-bulk-status-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Product Status Updated",
      "data": [
        {
          "id": 1,
          "title": "1 Litre Pepsi",
          "slug": "1-litre-pepsi",
          "category": {
            "id": 1,
            "name": "Beverages"
          },
          "sku": "1-LITRE-PEPSI",
          "barcode": "78263672323325",
          "image": null,
          "description": null,
          "unit": "bottle",
          "cost_price": 55,
          "selling_price": 110,
          "has_product_discount": true,
          "discount_type": "percentage",
          "discount_value": 10,
          "discount_name": "Eid Shopping",
          "has_product_tax": true,
          "taxes": [
            {
              "name": "GST",
              "type": "percentage",
              "value": 18
            }
          ],
          "is_pack_product": false,
          "pack_size": null,
          "pack_cost_price": null,
          "pack_selling_price": null,
          "sell_loose": true,
          "is_weight_based": false,
          "has_bulk_discount": false,
          "low_stock_threshold": 10,
          "total_price_each_unit": 116.82,
          "total_pack_price": null,
          "is_active": true,
          "is_pos_visible": true,
          "is_web_visible": true
        },
        {
          "id": 3,
          "title": "Basmati Rice",
          "slug": "basmati-rice",
          "category": {
            "id": 3,
            "name": "Rice & Daal"
          },
          "sku": "BASMATI-RICE",
          "barcode": "8964000123456",
          "image": null,
          "description": null,
          "unit": "kg",
          "cost_price": 300,
          "selling_price": 360,
          "has_product_discount": true,
          "discount_type": "percentage",
          "discount_value": 10,
          "discount_name": "Eid Shopping",
          "has_product_tax": true,
          "taxes": [
            {
              "name": "GST",
              "type": "percentage",
              "value": 18
            },
            {
              "name": "Excise",
              "type": "fixed",
              "value": 2
            }
          ],
          "is_pack_product": true,
          "pack_size": 25,
          "pack_cost_price": 7500,
          "pack_selling_price": 9000,
          "sell_loose": true,
          "is_weight_based": true,
          "has_bulk_discount": false,
          "low_stock_threshold": 10,
          "total_price_each_unit": 384.32,
          "total_pack_price": 9608,
          "is_active": false,
          "is_pos_visible": true,
          "is_web_visible": true
        }
      ]
    }
  }],
  "prod-bulk-visibility-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Product Visibility Updated",
      "data": [
        {
          "id": 1,
          "title": "1 Litre Pepsi",
          "slug": "1-litre-pepsi",
          "category": {
            "id": 1,
            "name": "Beverages"
          },
          "sku": "1-LITRE-PEPSI",
          "barcode": "78263672323325",
          "image": null,
          "description": null,
          "unit": "bottle",
          "cost_price": 55,
          "selling_price": 110,
          "has_product_discount": true,
          "discount_type": "percentage",
          "discount_value": 10,
          "discount_name": "Eid Shopping",
          "has_product_tax": true,
          "taxes": [
            {
              "name": "GST",
              "type": "percentage",
              "value": 18
            }
          ],
          "is_pack_product": false,
          "pack_size": null,
          "pack_cost_price": null,
          "pack_selling_price": null,
          "sell_loose": true,
          "is_weight_based": false,
          "has_bulk_discount": false,
          "low_stock_threshold": 10,
          "total_price_each_unit": 116.82,
          "total_pack_price": null,
          "is_active": true,
          "is_pos_visible": true,
          "is_web_visible": true
        },
        {
          "id": 3,
          "title": "Basmati Rice",
          "slug": "basmati-rice",
          "category": {
            "id": 3,
            "name": "Rice & Daal"
          },
          "sku": "BASMATI-RICE",
          "barcode": "8964000123456",
          "image": null,
          "description": null,
          "unit": "kg",
          "cost_price": 300,
          "selling_price": 360,
          "has_product_discount": true,
          "discount_type": "percentage",
          "discount_value": 10,
          "discount_name": "Eid Shopping",
          "has_product_tax": true,
          "taxes": [
            {
              "name": "GST",
              "type": "percentage",
              "value": 18
            },
            {
              "name": "Excise",
              "type": "fixed",
              "value": 2
            }
          ],
          "is_pack_product": true,
          "pack_size": 25,
          "pack_cost_price": 7500,
          "pack_selling_price": 9000,
          "sell_loose": true,
          "is_weight_based": true,
          "has_bulk_discount": false,
          "low_stock_threshold": 10,
          "total_price_each_unit": 384.32,
          "total_pack_price": 9608,
          "is_active": true,
          "is_pos_visible": true,
          "is_web_visible": false
        }
      ]
    }
  }],
  "cat-bulk-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Categories Updated",
      "data": [
        {
          "id": 1,
          "name": "Beverages",
          "slug": "beverages",
          "parent": null,
          "image_url": null,
          "description": null,
          "tax_type": "percentage",
          "tax_value": 5,
          "tax_name": "GST",
          "discount_type": "percentage",
          "discount_value": 5,
          "discount_name": "Eid Shopping",
          "is_active": true
        },
        {
          "id": 3,
          "name": "Rice & Daal",
          "slug": "rice-daal",
          "parent": null,
          "image_url": null,
          "description": null,
          "tax_type": "percentage",
          "tax_value": 0,
          "tax_name": "GST",
          "discount_type": "percentage",
          "discount_value": 15,
          "discount_name": "Ramzan Sale",
          "is_active": true
        }
      ]
    }
  }],
  "cat-bulk-status-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Category Status Updated",
      "data": [
        {
          "id": 2,
          "name": "Soap",
          "slug": "soap",
          "parent": null,
          "image_url": null,
          "description": null,
          "tax_type": "percentage",
          "tax_value": 10,
          "tax_name": "GST",
          "discount_type": "percentage",
          "discount_value": 0,
          "discount_name": "Eid Shopping",
          "is_active": true
        },
        {
          "id": 3,
          "name": "Rice & Daal",
          "slug": "rice-daal",
          "parent": null,
          "image_url": null,
          "description": null,
          "tax_type": "percentage",
          "tax_value": 0,
          "tax_name": "GST",
          "discount_type": "percentage",
          "discount_value": 15,
          "discount_name": "Ramzan Sale",
          "is_active": true
        }
      ]
    }
  }],
  "stock-bulk-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Stock Updated",
      "data": [
        {
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "qty": 40,
          "number_of_packs": null,
          "expiry_date": "2026-12-31",
          "low_stock_threshold": null,
          "is_low": false
        },
        {
          "product": {
            "id": 2,
            "title": "Lux Soap",
            "sku": "LUX-SOAP",
            "unit": "piece"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "qty": 20,
          "number_of_packs": 1,
          "expiry_date": "2027-06-30",
          "low_stock_threshold": 12,
          "is_low": false
        }
      ]
    }
  }],
  "stock-bulk-qty-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Stock Qty Updated",
      "data": [
        {
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "qty": 64,
          "number_of_packs": null,
          "expiry_date": "2026-12-31",
          "low_stock_threshold": null,
          "is_low": false
        },
        {
          "product": {
            "id": 3,
            "title": "Basmati Rice",
            "sku": "BASMATI-RICE",
            "unit": "kg"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "qty": 50,
          "number_of_packs": 2,
          "expiry_date": null,
          "is_low": false
        }
      ]
    }
  }],
  "transfer-bulk-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Stock Transfers Updated",
      "data": [
        {
          "id": 1,
          "from_location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "to_location": {
            "id": 2,
            "name": "Branch 2"
          },
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "qty": 24,
          "received_qty": null,
          "status": "on_the_way",
          "note": "Weekly refill + 4",
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "created_at": "2026-10-31T09:27:35.000Z"
        },
        {
          "id": 3,
          "from_location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "to_location": {
            "id": 3,
            "name": "Gulshan e Iqbal Block 2"
          },
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "qty": 10,
          "received_qty": null,
          "status": "on_the_way",
          "note": "Weekend stock",
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "created_at": "2026-10-31T09:27:35.000Z"
        }
      ]
    }
  }],
  "transfer-bulk-qty-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Stock Transfer Qty Updated",
      "data": [
        {
          "id": 2,
          "from_location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "to_location": {
            "id": 2,
            "name": "Branch 2"
          },
          "product": {
            "id": 2,
            "title": "Lux Soap",
            "sku": "LUX-SOAP",
            "unit": "piece"
          },
          "qty": 10,
          "received_qty": null,
          "status": "on_the_way",
          "note": null,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "created_at": "2026-10-31T09:27:35.000Z"
        }
      ]
    }
  }],
  "transfer-bulk-receive-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Stock Transfers Received",
      "data": [
        {
          "id": 1,
          "from_location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "to_location": {
            "id": 2,
            "name": "Branch 2"
          },
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "qty": 24,
          "received_qty": 22,
          "status": "completed",
          "note": "Weekly refill + 4 — 2 bottles broken — Received 22 of 24 (2 short)",
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "created_at": "2026-10-31T09:27:35.000Z"
        },
        {
          "id": 2,
          "from_location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "to_location": {
            "id": 2,
            "name": "Branch 2"
          },
          "product": {
            "id": 2,
            "title": "Lux Soap",
            "sku": "LUX-SOAP",
            "unit": "piece"
          },
          "qty": 10,
          "received_qty": 10,
          "status": "completed",
          "note": null,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "created_at": "2026-10-31T09:27:35.000Z"
        }
      ]
    }
  }],
  "transfer-bulk-status-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Stock Transfer Status Updated",
      "data": [
        {
          "id": 3,
          "from_location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "to_location": {
            "id": 3,
            "name": "Gulshan e Iqbal Block 2"
          },
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "qty": 10,
          "received_qty": null,
          "status": "cancelled",
          "note": "Weekend stock",
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "created_at": "2026-10-31T09:27:35.000Z"
        }
      ]
    }
  }],
  "order-bulk-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Orders Updated",
      "data": [
        {
          "id": 4,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "is_custom": true,
          "offer_exempt": false,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "customer": {
            "id": 1,
            "name": "Ali Khan",
            "phone": "03001231234"
          },
          "batch": {
            "id": 1,
            "status": "open"
          },
          "currency": "PKR",
          "order_items": [
            {
              "id": 1,
              "category": "Household",
              "title": "Tissue Box",
              "price": 150,
              "qty": 1,
              "unit_price": 150,
              "discount_amount": 0,
              "subtotal": 150,
              "tax_amount": 27,
              "total": 177
            },
            {
              "id": 2,
              "category": "Electronics",
              "title": "AA Batteries (pair)",
              "price": 80,
              "qty": 2,
              "unit_price": 80,
              "discount_amount": 0,
              "subtotal": 160,
              "tax_amount": 28.8,
              "total": 188.8
            }
          ],
          "subtotal": 310,
          "is_order_discounted": false,
          "order_discount_type": null,
          "discount_amount": 0,
          "payment_method": "mixed",
          "payment_status": "paid",
          "payment_gst_amount": 53.29,
          "tax_amount": 109.09,
          "payments": [
            {
              "method": "jazzcash",
              "bill_share": 47.62,
              "payment_tax_percent": 5,
              "payment_tax_amount": 2.38,
              "amount": 50,
              "paid": 50,
              "change": 0
            },
            {
              "method": "cash",
              "bill_share": 318.18,
              "payment_tax_percent": 16,
              "payment_tax_amount": 50.91,
              "amount": 369.09,
              "paid": 500,
              "change": 130.91
            }
          ],
          "fbr_invoice_enabled": false,
          "fbr_tax_amount": 0,
          "order_status": "completed",
          "total_amount": 419.09,
          "amount_paid": 550,
          "change_due": 130.91,
          "remaining_amount": 0,
          "cancel_reason": null,
          "cancelled_by": null,
          "placed_at": "2026-10-24T12:15:00.000Z",
          "channel": "pos",
          "is_pos_visible": true,
          "is_web_visible": false
        }
      ]
    }
  }],
  "order-bulk-payment-method-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Payment Method Updated",
      "data": [
        {
          "id": 7,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "is_custom": false,
          "offer_exempt": false,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "customer": null,
          "batch": {
            "id": 1,
            "status": "open"
          },
          "currency": "PKR",
          "order_items": [
            {
              "id": 1,
              "product": {
                "id": 1,
                "title": "1 Litre Pepsi",
                "sku": "1-LITRE-PEPSI",
                "unit": "bottle"
              },
              "category": {
                "id": 1,
                "name": "Beverages"
              },
              "qty": 1,
              "unit_price": 100,
              "discount_amount": 10,
              "subtotal": 90,
              "tax_amount": 36.9,
              "total": 126.9,
              "discount_source": "offer",
              "offers": [
                {
                  "id": 1,
                  "name": "Weekend 10% off",
                  "type": "promotional",
                  "amount": 10,
                  "buy_qty": null,
                  "get_qty": null,
                  "min_qty": null,
                  "promo_price": null,
                  "discount_type": "percentage",
                  "discount_value": 10
                }
              ],
              "free_qty": 0
            }
          ],
          "subtotal": 110.7,
          "is_order_discounted": false,
          "order_discount_type": null,
          "discount_amount": 0,
          "payment_method": "card",
          "payment_status": "paid",
          "payment_gst_amount": 6.34,
          "tax_amount": 43.24,
          "payments": [
            {
              "method": "card",
              "bill_share": 126.9,
              "payment_tax_percent": 5,
              "payment_tax_amount": 6.34,
              "amount": 133.24,
              "paid": 133.24,
              "change": 0
            }
          ],
          "fbr_invoice_enabled": false,
          "fbr_tax_amount": 0,
          "order_status": "completed",
          "total_amount": 133.24,
          "amount_paid": 133.24,
          "change_due": 0,
          "remaining_amount": 0,
          "cancel_reason": null,
          "cancelled_by": null,
          "placed_at": "2026-10-31T09:27:36.000Z",
          "channel": "pos",
          "is_pos_visible": true,
          "is_web_visible": false
        }
      ]
    }
  }],
  "order-bulk-status-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Order Status Updated",
      "data": [
        {
          "id": 8,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "is_custom": false,
          "offer_exempt": false,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "customer": null,
          "batch": {
            "id": 1,
            "status": "open"
          },
          "currency": "PKR",
          "order_items": [
            {
              "id": 1,
              "product": {
                "id": 1,
                "title": "1 Litre Pepsi",
                "sku": "1-LITRE-PEPSI",
                "unit": "bottle"
              },
              "category": {
                "id": 1,
                "name": "Beverages"
              },
              "qty": 1,
              "unit_price": 100,
              "discount_amount": 10,
              "subtotal": 90,
              "tax_amount": 36.9,
              "total": 126.9,
              "discount_source": "offer",
              "offers": [
                {
                  "id": 1,
                  "name": "Weekend 10% off",
                  "type": "promotional",
                  "amount": 10,
                  "buy_qty": null,
                  "get_qty": null,
                  "min_qty": null,
                  "promo_price": null,
                  "discount_type": "percentage",
                  "discount_value": 10
                }
              ],
              "free_qty": 0
            }
          ],
          "subtotal": 110.7,
          "is_order_discounted": false,
          "order_discount_type": null,
          "discount_amount": 0,
          "payment_method": "cash",
          "payment_status": "refunded",
          "payment_gst_amount": 20.3,
          "tax_amount": 57.2,
          "payments": [
            {
              "method": "cash",
              "bill_share": 126.9,
              "payment_tax_percent": 16,
              "payment_tax_amount": 20.3,
              "amount": 147.2,
              "paid": 500,
              "change": 352.8
            }
          ],
          "fbr_invoice_enabled": false,
          "fbr_tax_amount": 0,
          "order_status": "voided",
          "total_amount": 147.2,
          "amount_paid": 500,
          "change_due": 352.8,
          "remaining_amount": 0,
          "cancel_reason": "Rung up twice",
          "cancelled_by": null,
          "placed_at": "2026-10-31T09:27:36.000Z",
          "channel": "pos",
          "is_pos_visible": true,
          "is_web_visible": false
        }
      ]
    }
  }],
  "sup-bulk-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Suppliers Updated",
      "data": [
        {
          "id": 1,
          "location_scope": "all",
          "locations": [],
          "name": "Nestle Distributor",
          "email": "sales@nestle-dist.local",
          "phone": "03006666667",
          "payment_terms": "Net 30",
          "address": "Industrial Area",
          "is_active": true
        },
        {
          "id": 2,
          "location_scope": "all",
          "locations": [],
          "name": "Unilever Wholesale",
          "email": "orders@unilever-ws.local",
          "phone": "03007777777",
          "payment_terms": "Net 30",
          "address": "Korangi",
          "is_active": true
        }
      ]
    }
  }],
  "customer-bulk-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Customers Updated",
      "data": [
        {
          "id": 1,
          "name": "Ali Khan",
          "phone": "03009998888",
          "email": "ali@example.com",
          "location_id": null,
          "total_debt": 0,
          "remaining_debt": 0,
          "debt_notes": "Pays every Friday",
          "is_active": true
        }
      ]
    }
  }],
  "offer-bulk-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Offers Updated",
      "data": [
        {
          "id": 1,
          "type": "promotional",
          "name": "Weekend 10% off",
          "apply_to": "category",
          "category": {
            "id": 1,
            "name": "Beverages"
          },
          "discount_type": "percentage",
          "discount_value": 15,
          "promo_price": null,
          "free_product": null,
          "start_at": "2026-09-01T00:00:00.000Z",
          "end_at": "2027-01-15T23:59:59.000Z",
          "min_qty": null,
          "buy_qty": null,
          "get_qty": null,
          "location_scope": "all",
          "locations": [],
          "is_active": true,
          "status": "active",
          "staff": {
            "id": 1,
            "name": "Zayan Ahmed",
            "role": "store_admin"
          }
        },
        {
          "id": 2,
          "type": "bulk_discount",
          "name": "Buy 3 save 5%",
          "apply_to": "product",
          "product": {
            "id": 2,
            "title": "Lux Soap",
            "sku": "LUX-SOAP",
            "unit": "piece"
          },
          "discount_type": "percentage",
          "discount_value": 5,
          "promo_price": null,
          "free_product": null,
          "start_at": "2026-09-01T00:00:00.000Z",
          "end_at": "2026-12-31T23:59:59.000Z",
          "min_qty": 6,
          "buy_qty": null,
          "get_qty": null,
          "location_scope": "selected",
          "locations": [
            {
              "id": 1,
              "name": "Gulshan e Iqbal Block 13 D"
            }
          ],
          "is_active": true,
          "status": "active",
          "staff": {
            "id": 1,
            "name": "Zayan Ahmed",
            "role": "store_admin"
          }
        }
      ]
    }
  }],
  "offer-bulk-status-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Offer Status Updated",
      "data": [
        {
          "id": 3,
          "type": "bogo",
          "name": "Buy 2 get 1 free",
          "apply_to": "product",
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "discount_type": null,
          "discount_value": null,
          "promo_price": null,
          "free_product": null,
          "start_at": "2026-09-01T00:00:00.000Z",
          "end_at": "2026-12-31T23:59:59.000Z",
          "min_qty": null,
          "buy_qty": 2,
          "get_qty": 1,
          "location_scope": "selected",
          "locations": [
            {
              "id": 1,
              "name": "Gulshan e Iqbal Block 13 D"
            }
          ],
          "is_active": false,
          "status": "inactive",
          "staff": {
            "id": 1,
            "name": "Zayan Ahmed",
            "role": "store_admin"
          }
        }
      ]
    }
  }],
  "location-bulk-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Locations Updated",
      "data": [
        {
          "id": 3,
          "name": "Gulshan e Iqbal Block 2",
          "address_line": "Shop # 12, Main University Road, Gulshan e Iqbal Block 2, Karachi",
          "city": "Karachi",
          "country": "PK",
          "postal_code": "75300",
          "phone": "03001234568",
          "is_default": false,
          "is_active": true,
          "manager": null
        }
      ]
    }
  }],
  "staff-bulk-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Staff Updated",
      "data": [
        {
          "id": 3,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "name": "Ameer Hamza",
          "email": "ameer@acadex.co",
          "pin": "3333",
          "role": "cashier",
          "phone": "03001112222",
          "is_active": true
        },
        {
          "id": 4,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "name": "Yasir Ali Khan",
          "email": "yasir@acadex.co",
          "pin": "4444",
          "role": "cashier",
          "phone": "03004445555",
          "is_active": true
        }
      ]
    }
  }],
  "staff-bulk-location-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Staff Location Updated",
      "data": [
        {
          "id": 4,
          "location": {
            "id": 2,
            "name": "Branch 2"
          },
          "name": "Yasir Ali Khan",
          "email": "yasir@acadex.co",
          "pin": "4444",
          "role": "cashier",
          "phone": "03004445555",
          "is_active": true
        }
      ]
    }
  }],
  "staff-bulk-password-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Staff Password Updated",
      "data": [
        {
          "id": 4,
          "location": {
            "id": 2,
            "name": "Branch 2"
          },
          "name": "Yasir Ali Khan",
          "email": "yasir@acadex.co",
          "pin": "4545",
          "role": "cashier",
          "phone": "03004445555",
          "is_active": true
        }
      ]
    }
  }],
  "staff-bulk-status-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Staff Status Updated",
      "data": [
        {
          "id": 4,
          "location": {
            "id": 2,
            "name": "Branch 2"
          },
          "name": "Yasir Ali Khan",
          "email": "yasir@acadex.co",
          "pin": "4545",
          "role": "cashier",
          "phone": "03004445555",
          "is_active": false
        }
      ]
    }
  }],
  "batch-current": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": {
        "id": 1,
        "staff": {
          "id": 2,
          "name": "Ahmed Malik",
          "role": "manager"
        },
        "location": {
          "id": 1,
          "name": "Gulshan e Iqbal Block 13 D"
        },
        "status": "open",
        "opening_amount": 5000,
        "opening_at": "2026-10-24T09:00:00.000Z",
        "cash_sales": 1058.53,
        "card_sales": 133.24,
        "jazzcash_sales": 50,
        "easypaisa_sales": 111.88,
        "total_sales": 1353.65,
        "expected_cash": 6058.53,
        "total_cash": null,
        "cash_variance": null,
        "closing_at": null
      }
    }
  }],
  "batch-close": [{
    "label": "201 Created",
    "status": 201,
    "body": {
      "success": true,
      "message": "Batch Closed",
      "data": [
        {
          "id": 1,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "total_cash": 10000,
          "closing_at": "2026-10-24T17:00:00.000Z"
        }
      ]
    }
  }],
  "staff-clock-out": [{
    "label": "201 Created",
    "status": 201,
    "body": {
      "success": true,
      "message": "Clock Out Session",
      "data": [
        {
          "id": 1,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "status": "clock_out",
          "closing_at": "2026-10-24T17:00:00.000Z"
        }
      ]
    }
  }],
  "staff-session-bulk-patch": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Staff Sessions Updated",
      "data": [
        {
          "id": 1,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "status": "clock_out",
          "closing_at": "2026-10-24T18:30:00.000Z"
        }
      ]
    }
  }],
  "license-renew": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Renew License Successfully",
      "data": {
        "storeId": 1,
        "license_key": "LIC-0931-3965-76DF-21E2",
        "status": "active",
        "starts_at": "2026-10-31T09:27:37.090Z",
        "expires_at": "2026-11-30T09:27:37.090Z",
        "planId": 1,
        "renew_at": "2026-10-31T09:27:37.090Z"
      }
    }
  }],
  "plans-list": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": [
        {
          "id": "b3f389ce-91da-4bec-9c93-1f9c2f64a524",
          "code": "solo-pos",
          "type": "monthly",
          "name": "Solo",
          "price_pkr": 2500,
          "max_devices": 3,
          "max_locations": 3,
          "max_users": null,
          "reporting_level": "basic",
          "import_export": false,
          "staff_attendance": false,
          "email_integration": false,
          "whatsapp_integration": false,
          "receipt_customization": false,
          "barcode_scanning": false,
          "batch_management": false,
          "remote_access": false,
          "features": [],
          "is_active": true,
          "created_at": "2026-10-31T09:27:34.000Z",
          "updated_at": "2026-10-31T09:27:34.000Z"
        }
      ]
    }
  }],
  "store-me": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": {
        "id": 1,
        "name": "Acadex",
        "slug": "acadex",
        "custom_domain": null,
        "legal_name": "Acadex Pvt Ltd",
        "owner_name": "Zayan Ahmed",
        "business_type": "grocery",
        "address": "Shop # 432 Allama rasheed main rashid Minhas road Gulshan e Iqbal Block 13 D Karachi",
        "city": "Karachi",
        "contact_email": "info@acadex.co",
        "contact_phone": "021635645614",
        "logo_url": null,
        "favicon_url": null,
        "currency": "PKR",
        "timezone": "Asia/Karachi",
        "ntn": "1234567-8",
        "strn": "3277876123456",
        "fbr_invoice_enabled": false,
        "charge_tax_on_sales": true,
        "sales_tax_enabled": true,
        "sales_tax_rate": "18.00",
        "payment_tax_enabled": true,
        "expiry_warning_days": 30,
        "expiry_critical_days": 7,
        "receipt_footer": null,
        "default_location_number": 1,
        "location_number": 1,
        "pos_enabled": true,
        "web_enabled": true,
        "is_live": false,
        "is_active": true,
        "status": "active",
        "trial_ends_at": null,
        "created_at": "2026-10-31T09:27:34.000Z",
        "account_manager_name": null,
        "account_manager_phone": null,
        "suspend_reason": null,
        "plan": {
          "code": "solo-pos",
          "name": "Solo",
          "max_devices": 3,
          "max_locations": 3,
          "features": []
        }
      }
    }
  }],
  "location-list": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": [
        {
          "id": 1,
          "store_number": 1,
          "name": "Gulshan e Iqbal Block 13 D",
          "address_line": "Shop # 432 Allama rasheed main rashid Minhas road Gulshan e Iqbal Block 13 D Karachi",
          "city": "Karachi",
          "country": "PK",
          "postal_code": null,
          "phone": "03162196345",
          "is_default": true,
          "is_active": true,
          "manager": {
            "name": "Ahmed Malik",
            "email": "ahmed@acadex.co",
            "phone": null,
            "pin": "2222",
            "is_active": true
          },
          "created_at": "2026-10-31T09:27:34.000Z",
          "updated_at": "2026-10-31T09:27:34.000Z"
        },
        {
          "id": 2,
          "store_number": 1,
          "name": "Branch 2",
          "address_line": "Shop 5, Mall Road",
          "city": "Lahore",
          "country": "PK",
          "postal_code": null,
          "phone": null,
          "is_default": false,
          "is_active": true,
          "manager": null,
          "created_at": "2026-10-31T09:27:35.000Z",
          "updated_at": "2026-10-31T09:27:35.000Z"
        },
        {
          "id": 3,
          "store_number": 1,
          "name": "Gulshan e Iqbal Block 2",
          "address_line": "Shop # 12, Main University Road, Gulshan e Iqbal Block 2, Karachi",
          "city": "Karachi",
          "country": "PK",
          "postal_code": "75300",
          "phone": "03001234568",
          "is_default": false,
          "is_active": true,
          "manager": null,
          "created_at": "2026-10-31T09:27:35.000Z",
          "updated_at": "2026-10-31T09:27:36.000Z"
        }
      ]
    }
  }],
  "currency-get": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": {
        "code": "PKR",
        "name": "Pakistani Rupee",
        "symbol": "Rs",
        "decimal_places": 2,
        "symbol_position": "before"
      }
    }
  }],
  "staff-session-list": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": [
        {
          "id": 1,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "status": "clock_out",
          "opening_at": "2026-10-24T09:00:00.000Z",
          "closing_at": "2026-10-24T18:30:00.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 1,
        "total_pages": 1
      }
    }
  }],
  "cat-list": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": [
        {
          "id": 1,
          "name": "Beverages",
          "slug": "beverages",
          "parent": null,
          "image_url": null,
          "description": null,
          "tax_type": "percentage",
          "tax_value": 5,
          "tax_name": "GST",
          "discount_type": "percentage",
          "discount_value": 5,
          "discount_name": "Eid Shopping",
          "is_active": true
        },
        {
          "id": 3,
          "name": "Rice & Daal",
          "slug": "rice-daal",
          "parent": null,
          "image_url": null,
          "description": null,
          "tax_type": "percentage",
          "tax_value": 0,
          "tax_name": "GST",
          "discount_type": "percentage",
          "discount_value": 15,
          "discount_name": "Ramzan Sale",
          "is_active": true
        },
        {
          "id": 2,
          "name": "Soap",
          "slug": "soap",
          "parent": null,
          "image_url": null,
          "description": null,
          "tax_type": "percentage",
          "tax_value": 10,
          "tax_name": "GST",
          "discount_type": "percentage",
          "discount_value": 0,
          "discount_name": "Eid Shopping",
          "is_active": true
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 3,
        "total_pages": 1
      }
    }
  }],
  "prod-list": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": [
        {
          "id": 1,
          "title": "1 Litre Pepsi",
          "slug": "1-litre-pepsi",
          "category": {
            "id": 1,
            "name": "Beverages"
          },
          "sku": "1-LITRE-PEPSI",
          "barcode": "78263672323325",
          "image": null,
          "description": null,
          "unit": "bottle",
          "cost_price": 55,
          "selling_price": 110,
          "has_product_discount": true,
          "discount_type": "percentage",
          "discount_value": 10,
          "discount_name": "Eid Shopping",
          "has_product_tax": true,
          "taxes": [
            {
              "name": "GST",
              "type": "percentage",
              "value": 18
            }
          ],
          "is_pack_product": false,
          "pack_size": null,
          "pack_cost_price": null,
          "pack_selling_price": null,
          "sell_loose": true,
          "is_weight_based": false,
          "has_bulk_discount": false,
          "low_stock_threshold": 10,
          "total_price_each_unit": 116.82,
          "total_pack_price": null,
          "is_active": true,
          "is_pos_visible": true,
          "is_web_visible": true,
          "qty": 63,
          "stocks": [
            {
              "location": {
                "id": 2,
                "name": "Branch 2"
              },
              "qty": 22,
              "expiry_date": null
            },
            {
              "location": {
                "id": 1,
                "name": "Gulshan e Iqbal Block 13 D"
              },
              "qty": 41,
              "expiry_date": "2026-12-31"
            }
          ]
        },
        {
          "id": 3,
          "title": "Basmati Rice",
          "slug": "basmati-rice",
          "category": {
            "id": 3,
            "name": "Rice & Daal"
          },
          "sku": "BASMATI-RICE",
          "barcode": "8964000123456",
          "image": null,
          "description": null,
          "unit": "kg",
          "cost_price": 300,
          "selling_price": 360,
          "has_product_discount": true,
          "discount_type": "percentage",
          "discount_value": 10,
          "discount_name": "Eid Shopping",
          "has_product_tax": true,
          "taxes": [
            {
              "name": "GST",
              "type": "percentage",
              "value": 18
            },
            {
              "name": "Excise",
              "type": "fixed",
              "value": 2
            }
          ],
          "is_pack_product": true,
          "pack_size": 25,
          "pack_cost_price": 7500,
          "pack_selling_price": 9000,
          "sell_loose": true,
          "is_weight_based": true,
          "has_bulk_discount": false,
          "low_stock_threshold": 10,
          "total_price_each_unit": 384.32,
          "total_pack_price": 9608,
          "is_active": true,
          "is_pos_visible": true,
          "is_web_visible": false,
          "qty": 50,
          "stocks": [
            {
              "location": {
                "id": 1,
                "name": "Gulshan e Iqbal Block 13 D"
              },
              "qty": 50,
              "expiry_date": null
            }
          ]
        },
        {
          "id": 2,
          "title": "Lux Soap",
          "slug": "lux-soap",
          "category": {
            "id": 2,
            "name": "Soap"
          },
          "sku": "LUX-SOAP",
          "barcode": "8961014001234",
          "image": null,
          "description": null,
          "unit": "piece",
          "cost_price": 79.17,
          "selling_price": 105,
          "has_product_discount": true,
          "discount_type": "percentage",
          "discount_value": 0,
          "discount_name": "Eid Shopping",
          "has_product_tax": true,
          "taxes": [
            {
              "name": "GST",
              "type": "percentage",
              "value": 18
            }
          ],
          "is_pack_product": true,
          "pack_size": 12,
          "pack_cost_price": 950,
          "pack_selling_price": 1260,
          "sell_loose": true,
          "is_weight_based": false,
          "has_bulk_discount": false,
          "low_stock_threshold": 24,
          "total_price_each_unit": 123.9,
          "total_pack_price": 1486.8,
          "is_active": true,
          "is_pos_visible": true,
          "is_web_visible": true,
          "qty": 20,
          "stocks": [
            {
              "location": {
                "id": 2,
                "name": "Branch 2"
              },
              "qty": 10,
              "expiry_date": null
            },
            {
              "location": {
                "id": 1,
                "name": "Gulshan e Iqbal Block 13 D"
              },
              "qty": 10,
              "expiry_date": "2027-06-30"
            }
          ]
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 3,
        "total_pages": 1
      }
    }
  }],
  "prod-expiry": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": [
        {
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "barcode": "78263672323325",
            "unit": "bottle"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "qty": 41,
          "expiry_date": "2026-12-31",
          "expiry_status": "ok"
        },
        {
          "product": {
            "id": 2,
            "title": "Lux Soap",
            "sku": "LUX-SOAP",
            "barcode": "8961014001234",
            "unit": "piece"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "qty": 10,
          "expiry_date": "2027-06-30",
          "expiry_status": "ok"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 2,
        "total_pages": 1
      }
    }
  }],
  "prod-weight-list": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": [
        {
          "id": 3,
          "title": "Basmati Rice",
          "slug": "basmati-rice",
          "category": {
            "id": 3,
            "name": "Rice & Daal"
          },
          "sku": "BASMATI-RICE",
          "barcode": "8964000123456",
          "image": null,
          "description": null,
          "unit": "kg",
          "cost_price": 300,
          "selling_price": 360,
          "has_product_discount": true,
          "discount_type": "percentage",
          "discount_value": 10,
          "discount_name": "Eid Shopping",
          "has_product_tax": true,
          "taxes": [
            {
              "name": "GST",
              "type": "percentage",
              "value": 18
            },
            {
              "name": "Excise",
              "type": "fixed",
              "value": 2
            }
          ],
          "is_pack_product": true,
          "pack_size": 25,
          "pack_cost_price": 7500,
          "pack_selling_price": 9000,
          "sell_loose": true,
          "is_weight_based": true,
          "has_bulk_discount": false,
          "low_stock_threshold": 10,
          "total_price_each_unit": 384.32,
          "total_pack_price": 9608,
          "is_active": true,
          "is_pos_visible": true,
          "is_web_visible": false
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 1,
        "total_pages": 1
      }
    }
  }],
  "order-list-completed": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": [
        {
          "id": 7,
          "is_custom": false,
          "location_name": "Gulshan e Iqbal Block 13 D",
          "items": 1,
          "currency": "PKR",
          "total_amount": 133.24,
          "status": "completed",
          "payment_status": "paid",
          "remaining_amount": 0,
          "placed_at": "2026-10-31T09:27:36.000Z",
          "channel": "pos"
        },
        {
          "id": 5,
          "is_custom": false,
          "location_name": "Gulshan e Iqbal Block 13 D",
          "items": 2,
          "currency": "PKR",
          "total_amount": 654.12,
          "status": "completed",
          "payment_status": "paid",
          "remaining_amount": 0,
          "placed_at": "2026-10-24T13:30:00.000Z",
          "channel": "pos"
        },
        {
          "id": 4,
          "is_custom": true,
          "location_name": "Gulshan e Iqbal Block 13 D",
          "items": 2,
          "currency": "PKR",
          "total_amount": 419.09,
          "status": "completed",
          "payment_status": "paid",
          "remaining_amount": 0,
          "placed_at": "2026-10-24T12:15:00.000Z",
          "channel": "pos"
        },
        {
          "id": 1,
          "is_custom": false,
          "location_name": "Gulshan e Iqbal Block 13 D",
          "items": 2,
          "currency": "PKR",
          "total_amount": 463.77,
          "status": "partial_refunded",
          "payment_status": "paid",
          "remaining_amount": 0,
          "placed_at": "2026-10-24T10:05:00.000Z",
          "channel": "pos"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 4,
        "total_pages": 1
      }
    }
  }],
  "order-list-pending": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": [],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 0,
        "total_pages": 1
      }
    }
  }],
  "order-list-cancelled": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": [
        {
          "id": 8,
          "is_custom": false,
          "location_name": "Gulshan e Iqbal Block 13 D",
          "items": 1,
          "currency": "PKR",
          "total_amount": 147.2,
          "status": "voided",
          "payment_status": "refunded",
          "remaining_amount": 0,
          "placed_at": "2026-10-31T09:27:36.000Z",
          "channel": "pos"
        },
        {
          "id": 6,
          "is_custom": false,
          "location_name": "Gulshan e Iqbal Block 13 D",
          "items": 1,
          "currency": "PKR",
          "total_amount": 147.2,
          "status": "voided",
          "payment_status": "refunded",
          "remaining_amount": 0,
          "placed_at": "2026-10-31T09:27:36.000Z",
          "channel": "pos"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 2,
        "total_pages": 1
      }
    }
  }],
  "order-get": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": {
        "id": 1,
        "order_id": 1,
        "store": {
          "name": "Acadex",
          "ntn": "1234567-8",
          "strn": "3277876123456"
        },
        "issued_at": "2026-10-24T10:05:00.000Z",
        "channel": "pos",
        "status": "partial_refunded",
        "payment_status": "paid",
        "payment_method": "cash",
        "location": {
          "id": 1,
          "name": "Gulshan e Iqbal Block 13 D"
        },
        "cashier": {
          "id": 2,
          "name": "Ahmed Malik"
        },
        "customer": null,
        "currency": "PKR",
        "items": [
          {
            "id": 1,
            "qty": 2,
            "unit_price": 100,
            "gross_amount": 200,
            "product": {
              "id": 1,
              "title": "1 Litre Pepsi",
              "sku": "1-LITRE-PEPSI",
              "barcode": "78263672323325",
              "discount": null,
              "taxes": [
                {
                  "name": "GST",
                  "type": "percentage",
                  "value": 18,
                  "amount": 32.4
                }
              ]
            },
            "category": {
              "id": 1,
              "name": "Beverages",
              "discount": null,
              "tax": {
                "name": "GST",
                "type": "percentage",
                "value": 5,
                "amount": 9
              }
            },
            "offer": {
              "id": 1,
              "name": "Weekend 10% off",
              "type": "promotional",
              "discount_type": "percentage",
              "discount_value": 10,
              "amount": 20
            },
            "sales_tax": {
              "rate": 18,
              "amount": 32.4
            },
            "discount_amount": 20,
            "subtotal": 180,
            "tax_amount": 73.8,
            "refunded_qty": 1,
            "total": 253.8
          },
          {
            "id": 2,
            "qty": 1,
            "unit_price": 100,
            "gross_amount": 100,
            "product": {
              "id": 2,
              "title": "Lux Soap",
              "sku": "LUX-SOAP",
              "barcode": "8961014001234",
              "discount": null,
              "taxes": [
                {
                  "name": "GST",
                  "type": "percentage",
                  "value": 18,
                  "amount": 18
                }
              ]
            },
            "category": {
              "id": 2,
              "name": "Soap",
              "discount": null,
              "tax": {
                "name": "GST",
                "type": "percentage",
                "value": 10,
                "amount": 10
              }
            },
            "offer": null,
            "sales_tax": {
              "rate": 18,
              "amount": 18
            },
            "discount_amount": 0,
            "subtotal": 100,
            "tax_amount": 46,
            "refunded_qty": 1,
            "total": 146
          }
        ],
        "subtotal": 280,
        "sales_tax": {
          "rate": 18,
          "amount": 50.4
        },
        "payment_gst_amount": 63.97,
        "tax_amount": 183.77,
        "total": 463.77,
        "amount_paid": 1000,
        "change_due": 536.23,
        "payments": [
          {
            "method": "cash",
            "gst_percent": 16,
            "gst_amount": 63.97,
            "amount": 463.77,
            "paid": 1000,
            "change": 536.23,
            "status": "success"
          }
        ],
        "receipt_id": 1,
        "staff": {
          "id": 2,
          "name": "Ahmed Malik",
          "role": "manager"
        },
        "batch": {
          "id": 1,
          "status": "closed"
        },
        "is_custom": false,
        "offer_exempt": false,
        "placed_at": "2026-10-24T10:05:00.000Z",
        "cancel_reason": null,
        "transactions": [
          {
            "id": 1,
            "method": "cash",
            "amount": 463.77,
            "tax_amount": 63.97,
            "status": "success",
            "paid_at": "2026-10-24T10:05:00.000Z"
          }
        ],
        "refunds": [
          {
            "id": 6,
            "refund_type": "partial",
            "location": {
              "id": 1,
              "name": "Gulshan e Iqbal Block 13 D"
            },
            "staff": {
              "id": 2,
              "name": "Ahmed Malik",
              "role": "manager"
            },
            "order": {
              "id": 1,
              "status": "partial_refunded"
            },
            "receiptId": 11,
            "currency": "PKR",
            "reason": "Damaged item",
            "items": [
              {
                "order_item_id": 2,
                "product": {
                  "id": 2,
                  "title": "Lux Soap",
                  "sku": "LUX-SOAP",
                  "unit": "piece"
                },
                "qty": 1,
                "unit_price": 100,
                "amount": 100,
                "tax": 69.37
              }
            ],
            "amount": 100,
            "tax": 69.37,
            "total": 169.37,
            "payments": [
              {
                "amount": 169.37,
                "method": "cash",
                "bill_share": 146.01,
                "payment_tax_amount": 23.36,
                "payment_tax_percent": 16
              }
            ],
            "refunded_at": "2026-10-31T09:27:36.000Z"
          },
          {
            "id": 5,
            "refund_type": "partial",
            "location": {
              "id": 1,
              "name": "Gulshan e Iqbal Block 13 D"
            },
            "staff": {
              "id": 2,
              "name": "Ahmed Malik",
              "role": "manager"
            },
            "order": {
              "id": 1,
              "status": "partial_refunded"
            },
            "receiptId": 10,
            "currency": "PKR",
            "reason": "Customer return",
            "items": [
              {
                "order_item_id": 1,
                "product": {
                  "id": 1,
                  "title": "1 Litre Pepsi",
                  "sku": "1-LITRE-PEPSI",
                  "unit": "bottle"
                },
                "qty": 1,
                "unit_price": 100,
                "amount": 90,
                "tax": 57.2
              }
            ],
            "amount": 90,
            "tax": 57.2,
            "total": 147.2,
            "payments": [
              {
                "amount": 147.2,
                "method": "cash",
                "bill_share": 126.9,
                "payment_tax_amount": 20.3,
                "payment_tax_percent": 16
              }
            ],
            "refunded_at": "2026-10-31T09:27:36.000Z"
          }
        ]
      }
    }
  }],
  "refund-list-complete": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": [
        {
          "id": 3,
          "refund_type": "complete",
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "order": {
            "id": 3,
            "status": "refunded"
          },
          "receiptId": 8,
          "currency": "PKR",
          "reason": "Customer changed mind",
          "items": [
            {
              "order_item_id": 1,
              "product": {
                "id": 2,
                "title": "Lux Soap",
                "sku": "LUX-SOAP",
                "unit": "piece"
              },
              "qty": 12,
              "unit_price": 100,
              "amount": 1140,
              "tax": 780.97
            },
            {
              "order_item_id": 2,
              "product": {
                "id": 1,
                "title": "1 Litre Pepsi",
                "sku": "1-LITRE-PEPSI",
                "unit": "bottle"
              },
              "qty": 1,
              "unit_price": 100,
              "amount": 90,
              "tax": 56.46
            }
          ],
          "amount": 1230,
          "tax": 837.43,
          "total": 2067.43,
          "payments": [
            {
              "amount": 100,
              "method": "card",
              "bill_share": 95.24,
              "payment_tax_amount": 4.76,
              "payment_tax_percent": 5
            },
            {
              "amount": 1967.43,
              "method": "cash",
              "bill_share": 1696.07,
              "payment_tax_amount": 271.36,
              "payment_tax_percent": 16
            }
          ],
          "refunded_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 1,
          "refund_type": "complete",
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "order": {
            "id": 2,
            "status": "refunded"
          },
          "receiptId": 6,
          "currency": "PKR",
          "reason": "Full return",
          "items": [
            {
              "order_item_id": 1,
              "title": "SP10 Blue Pen",
              "qty": 2,
              "unit_price": 50,
              "amount": 100,
              "tax": 36.88
            },
            {
              "order_item_id": 2,
              "title": "A4 Notebook",
              "qty": 1,
              "unit_price": 120,
              "amount": 120,
              "tax": 44.26
            }
          ],
          "amount": 220,
          "tax": 81.14,
          "total": 301.14,
          "payments": [
            {
              "amount": 301.14,
              "method": "cash",
              "bill_share": 259.6,
              "payment_tax_amount": 41.54,
              "payment_tax_percent": 16
            }
          ],
          "refunded_at": "2026-10-31T09:27:36.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 2,
        "total_pages": 1
      }
    }
  }],
  "refund-list-partial": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": [
        {
          "id": 6,
          "refund_type": "partial",
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "order": {
            "id": 1,
            "status": "partial_refunded"
          },
          "receiptId": 11,
          "currency": "PKR",
          "reason": "Damaged item",
          "items": [
            {
              "order_item_id": 2,
              "product": {
                "id": 2,
                "title": "Lux Soap",
                "sku": "LUX-SOAP",
                "unit": "piece"
              },
              "qty": 1,
              "unit_price": 100,
              "amount": 100,
              "tax": 69.37
            }
          ],
          "amount": 100,
          "tax": 69.37,
          "total": 169.37,
          "payments": [
            {
              "amount": 169.37,
              "method": "cash",
              "bill_share": 146.01,
              "payment_tax_amount": 23.36,
              "payment_tax_percent": 16
            }
          ],
          "refunded_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 5,
          "refund_type": "partial",
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "order": {
            "id": 1,
            "status": "partial_refunded"
          },
          "receiptId": 10,
          "currency": "PKR",
          "reason": "Customer return",
          "items": [
            {
              "order_item_id": 1,
              "product": {
                "id": 1,
                "title": "1 Litre Pepsi",
                "sku": "1-LITRE-PEPSI",
                "unit": "bottle"
              },
              "qty": 1,
              "unit_price": 100,
              "amount": 90,
              "tax": 57.2
            }
          ],
          "amount": 90,
          "tax": 57.2,
          "total": 147.2,
          "payments": [
            {
              "amount": 147.2,
              "method": "cash",
              "bill_share": 126.9,
              "payment_tax_amount": 20.3,
              "payment_tax_percent": 16
            }
          ],
          "refunded_at": "2026-10-31T09:27:36.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 2,
        "total_pages": 1
      }
    }
  }],
  "movement-list": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": [
        {
          "id": 26,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "supplier": null,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "order": {
            "id": 8,
            "status": "voided"
          },
          "movement_type": "refund",
          "reason": "refund",
          "reason_note": null,
          "qty": 1,
          "qty_after": 41,
          "unit_sold": 5,
          "created_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 25,
          "location": {
            "id": 2,
            "name": "Branch 2"
          },
          "product": {
            "id": 2,
            "title": "Lux Soap",
            "sku": "LUX-SOAP",
            "unit": "piece"
          },
          "supplier": null,
          "staff": {
            "id": 1,
            "name": "Zayan Ahmed",
            "role": "store_admin"
          },
          "order": null,
          "movement_type": "transfer_in",
          "reason": "transfer",
          "reason_note": null,
          "qty": 10,
          "qty_after": 10,
          "unit_sold": 0,
          "created_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 24,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "product": {
            "id": 2,
            "title": "Lux Soap",
            "sku": "LUX-SOAP",
            "unit": "piece"
          },
          "supplier": null,
          "staff": {
            "id": 1,
            "name": "Zayan Ahmed",
            "role": "store_admin"
          },
          "order": null,
          "movement_type": "transfer_out",
          "reason": "transfer",
          "reason_note": null,
          "qty": -10,
          "qty_after": 10,
          "unit_sold": 2,
          "created_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 23,
          "location": {
            "id": 2,
            "name": "Branch 2"
          },
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "supplier": null,
          "staff": {
            "id": 1,
            "name": "Zayan Ahmed",
            "role": "store_admin"
          },
          "order": null,
          "movement_type": "transfer_in",
          "reason": "transfer",
          "reason_note": "Weekly refill + 4 — 2 bottles broken — Received 22 of 24 (2 short)",
          "qty": 22,
          "qty_after": 22,
          "unit_sold": 0,
          "created_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 22,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "supplier": null,
          "staff": {
            "id": 1,
            "name": "Zayan Ahmed",
            "role": "store_admin"
          },
          "order": null,
          "movement_type": "transfer_out",
          "reason": "transfer",
          "reason_note": "Weekly refill + 4 — 2 bottles broken — Received 22 of 24 (2 short)",
          "qty": -24,
          "qty_after": 40,
          "unit_sold": 6,
          "created_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 21,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "product": {
            "id": 3,
            "title": "Basmati Rice",
            "sku": "BASMATI-RICE",
            "unit": "kg"
          },
          "supplier": null,
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "order": null,
          "movement_type": "stock_in",
          "reason": "purchase",
          "reason_note": "Nestle Distributor delivery",
          "qty": 50,
          "qty_after": 50,
          "unit_sold": 0,
          "created_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 20,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "supplier": null,
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "order": null,
          "movement_type": "stock_in",
          "reason": "purchase",
          "reason_note": "Nestle Distributor delivery",
          "qty": 24,
          "qty_after": 64,
          "unit_sold": 6,
          "created_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 19,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "product": {
            "id": 2,
            "title": "Lux Soap",
            "sku": "LUX-SOAP",
            "unit": "piece"
          },
          "supplier": null,
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "order": null,
          "movement_type": "stock_out",
          "reason": "damage",
          "reason_note": "2 soaps damaged",
          "qty": -2,
          "qty_after": 20,
          "unit_sold": 2,
          "created_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 18,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "supplier": null,
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "order": null,
          "movement_type": "adjustment",
          "reason": "count",
          "reason_note": "Physical count",
          "qty": -2,
          "qty_after": 40,
          "unit_sold": 6,
          "created_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 17,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "supplier": null,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "order": {
            "id": 8,
            "status": "voided"
          },
          "movement_type": "sale",
          "reason": "sale",
          "reason_note": null,
          "qty": -1,
          "qty_after": 42,
          "unit_sold": 6,
          "created_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 16,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "supplier": null,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "order": {
            "id": 7,
            "status": "completed"
          },
          "movement_type": "sale",
          "reason": "sale",
          "reason_note": null,
          "qty": -1,
          "qty_after": 43,
          "unit_sold": 5,
          "created_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 15,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "supplier": null,
          "staff": {
            "id": 1,
            "name": "Zayan Ahmed",
            "role": "store_admin"
          },
          "order": {
            "id": 6,
            "status": "voided"
          },
          "movement_type": "refund",
          "reason": "refund",
          "reason_note": null,
          "qty": 1,
          "qty_after": 44,
          "unit_sold": 4,
          "created_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 14,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "supplier": null,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "order": {
            "id": 6,
            "status": "voided"
          },
          "movement_type": "sale",
          "reason": "sale",
          "reason_note": null,
          "qty": -1,
          "qty_after": 43,
          "unit_sold": 5,
          "created_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 13,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "product": {
            "id": 2,
            "title": "Lux Soap",
            "sku": "LUX-SOAP",
            "unit": "piece"
          },
          "supplier": null,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "order": {
            "id": 1,
            "status": "partial_refunded"
          },
          "movement_type": "refund",
          "reason": "refund",
          "reason_note": null,
          "qty": 1,
          "qty_after": 22,
          "unit_sold": 2,
          "created_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 12,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "supplier": null,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "order": {
            "id": 1,
            "status": "partial_refunded"
          },
          "movement_type": "refund",
          "reason": "refund",
          "reason_note": null,
          "qty": 1,
          "qty_after": 44,
          "unit_sold": 4,
          "created_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 11,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "supplier": null,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "order": {
            "id": 3,
            "status": "refunded"
          },
          "movement_type": "refund",
          "reason": "refund",
          "reason_note": null,
          "qty": 1,
          "qty_after": 43,
          "unit_sold": 5,
          "created_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 10,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "product": {
            "id": 2,
            "title": "Lux Soap",
            "sku": "LUX-SOAP",
            "unit": "piece"
          },
          "supplier": null,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "order": {
            "id": 3,
            "status": "refunded"
          },
          "movement_type": "refund",
          "reason": "refund",
          "reason_note": null,
          "qty": 12,
          "qty_after": 21,
          "unit_sold": 3,
          "created_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 9,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "product": {
            "id": 2,
            "title": "Lux Soap",
            "sku": "LUX-SOAP",
            "unit": "piece"
          },
          "supplier": null,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "order": {
            "id": 5,
            "status": "completed"
          },
          "movement_type": "sale",
          "reason": "sale",
          "reason_note": null,
          "qty": -2,
          "qty_after": 9,
          "unit_sold": 15,
          "created_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 8,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "supplier": null,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "order": {
            "id": 5,
            "status": "completed"
          },
          "movement_type": "sale",
          "reason": "sale",
          "reason_note": null,
          "qty": -3,
          "qty_after": 42,
          "unit_sold": 6,
          "created_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 7,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "supplier": null,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "order": {
            "id": 3,
            "status": "refunded"
          },
          "movement_type": "sale",
          "reason": "sale",
          "reason_note": null,
          "qty": -1,
          "qty_after": 45,
          "unit_sold": 3,
          "created_at": "2026-10-31T09:27:36.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 26,
        "total_pages": 2
      }
    }
  }],
  "transfer-list": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": [
        {
          "id": 1,
          "from_location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "to_location": {
            "id": 2,
            "name": "Branch 2"
          },
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "qty": 24,
          "received_qty": 22,
          "status": "completed",
          "note": "Weekly refill + 4 — 2 bottles broken — Received 22 of 24 (2 short)",
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "created_at": "2026-10-31T09:27:35.000Z"
        },
        {
          "id": 2,
          "from_location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "to_location": {
            "id": 2,
            "name": "Branch 2"
          },
          "product": {
            "id": 2,
            "title": "Lux Soap",
            "sku": "LUX-SOAP",
            "unit": "piece"
          },
          "qty": 10,
          "received_qty": 10,
          "status": "completed",
          "note": null,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "created_at": "2026-10-31T09:27:35.000Z"
        },
        {
          "id": 3,
          "from_location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "to_location": {
            "id": 3,
            "name": "Gulshan e Iqbal Block 2"
          },
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "qty": 10,
          "received_qty": null,
          "status": "cancelled",
          "note": "Weekend stock",
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "created_at": "2026-10-31T09:27:35.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 3,
        "total_pages": 1
      }
    }
  }],
  "offer-list": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": [
        {
          "id": 1,
          "type": "promotional",
          "name": "Weekend 10% off",
          "apply_to": "category",
          "category": {
            "id": 1,
            "name": "Beverages"
          },
          "discount_type": "percentage",
          "discount_value": 15,
          "promo_price": null,
          "free_product": null,
          "start_at": "2026-09-01T00:00:00.000Z",
          "end_at": "2027-01-15T23:59:59.000Z",
          "min_qty": null,
          "buy_qty": null,
          "get_qty": null,
          "location_scope": "all",
          "locations": [],
          "is_active": true,
          "status": "active",
          "staff": {
            "id": 1,
            "name": "Zayan Ahmed",
            "role": "store_admin"
          }
        },
        {
          "id": 2,
          "type": "bulk_discount",
          "name": "Buy 3 save 5%",
          "apply_to": "product",
          "product": {
            "id": 2,
            "title": "Lux Soap",
            "sku": "LUX-SOAP",
            "unit": "piece"
          },
          "discount_type": "percentage",
          "discount_value": 5,
          "promo_price": null,
          "free_product": null,
          "start_at": "2026-09-01T00:00:00.000Z",
          "end_at": "2026-12-31T23:59:59.000Z",
          "min_qty": 6,
          "buy_qty": null,
          "get_qty": null,
          "location_scope": "selected",
          "locations": [
            {
              "id": 1,
              "name": "Gulshan e Iqbal Block 13 D"
            }
          ],
          "is_active": true,
          "status": "active",
          "staff": {
            "id": 1,
            "name": "Zayan Ahmed",
            "role": "store_admin"
          }
        },
        {
          "id": 3,
          "type": "bogo",
          "name": "Buy 2 get 1 free",
          "apply_to": "product",
          "product": {
            "id": 1,
            "title": "1 Litre Pepsi",
            "sku": "1-LITRE-PEPSI",
            "unit": "bottle"
          },
          "discount_type": null,
          "discount_value": null,
          "promo_price": null,
          "free_product": null,
          "start_at": "2026-09-01T00:00:00.000Z",
          "end_at": "2026-12-31T23:59:59.000Z",
          "min_qty": null,
          "buy_qty": 2,
          "get_qty": 1,
          "location_scope": "selected",
          "locations": [
            {
              "id": 1,
              "name": "Gulshan e Iqbal Block 13 D"
            }
          ],
          "is_active": false,
          "status": "inactive",
          "staff": {
            "id": 1,
            "name": "Zayan Ahmed",
            "role": "store_admin"
          }
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 3,
        "total_pages": 1
      }
    }
  }],
  "sup-list": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": [
        {
          "id": 1,
          "location_scope": "all",
          "locations": [],
          "name": "Nestle Distributor",
          "email": "sales@nestle-dist.local",
          "phone": "03006666667",
          "payment_terms": "Net 30",
          "address": "Industrial Area",
          "is_active": true
        },
        {
          "id": 3,
          "location_scope": "selected",
          "locations": [
            {
              "id": 1,
              "name": "Gulshan e Iqbal Block 13 D"
            }
          ],
          "name": "Rice Mills Co",
          "email": "info@ricemills.local",
          "phone": "03008888888",
          "payment_terms": "Cash on delivery",
          "address": "Gujranwala",
          "is_active": true
        },
        {
          "id": 2,
          "location_scope": "all",
          "locations": [],
          "name": "Unilever Wholesale",
          "email": "orders@unilever-ws.local",
          "phone": "03007777777",
          "payment_terms": "Net 30",
          "address": "Korangi",
          "is_active": true
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 3,
        "total_pages": 1
      }
    }
  }],
  "rep-all-locations": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": {
        "period": "daily",
        "locationId": null,
        "from": null,
        "to": null,
        "sales_summary": {
          "totals": {
            "orders": 4,
            "units_sold": 10,
            "gross_sales": 1010,
            "line_discounts": 120,
            "order_discounts": 0,
            "discounts": 120,
            "net_sales": 890,
            "taxes": {
              "sales_tax": 160.2,
              "product_tax": 104.4,
              "category_tax": 39,
              "payment_method_tax": {
                "cash": 146,
                "card": 6.34,
                "jazzcash": 2.38,
                "easypaisa": 5.33,
                "total": 160.05
              },
              "total": 463.65
            },
            "shipping": 0,
            "total_sales": 1353.65,
            "total_collected": 4038.79,
            "on_credit": 0,
            "refunds": 2685.14,
            "refunded_tax": 1045.14,
            "refunded_orders": 2,
            "refunded_items": 18,
            "voided_orders": 2,
            "cancelled_orders": 0,
            "cost": 400,
            "discounts_by_source": {
              "product": 0,
              "category": 0,
              "product+category": 0,
              "bulk_tier": 0,
              "offer": 120,
              "custom": 0,
              "unknown": 0
            },
            "tax": 463.65,
            "revenue": 890,
            "tax_collection": {
              "product_tax": 104.4,
              "category_tax": 39,
              "default_store_tax": 160.2,
              "payment_gst": 160.05,
              "payment_gst_cash": 146,
              "payment_gst_card": 6.34,
              "payment_gst_jazzcash": 2.38,
              "payment_gst_easypaisa": 5.33,
              "total": 463.65
            },
            "gross_profit": 490,
            "avg_order_value": 338.41,
            "payments_net": 1353.65
          },
          "trend": [
            {
              "bucket": "2026-10-24",
              "sales": 1220.41,
              "orders": 3
            },
            {
              "bucket": "2026-10-31",
              "sales": 133.24,
              "orders": 1
            }
          ],
          "payments": [
            {
              "method": "CASH",
              "transactions": 5,
              "gross_amount": 3643.67,
              "tax": 146.02,
              "refunds": 2585.14,
              "net_amount": 1058.53,
              "percent": 78
            },
            {
              "method": "CARD",
              "transactions": 2,
              "gross_amount": 233.24,
              "tax": 6.34,
              "refunds": 100,
              "net_amount": 133.24,
              "percent": 10
            },
            {
              "method": "EASYPAISA",
              "transactions": 1,
              "gross_amount": 111.88,
              "tax": 5.33,
              "refunds": 0,
              "net_amount": 111.88,
              "percent": 8
            },
            {
              "method": "JAZZCASH",
              "transactions": 1,
              "gross_amount": 50,
              "tax": 2.38,
              "refunds": 0,
              "net_amount": 50,
              "percent": 4
            }
          ]
        },
        "by_product": {
          "rows": [
            {
              "id": 1,
              "product": "1 Litre Pepsi",
              "category": "Beverages",
              "units_sold": 5,
              "gross_sales": 500,
              "discounts": 120,
              "net_sales": 380,
              "sales_tax": 68.4,
              "product_tax": 68.4,
              "category_tax": 19,
              "tax": 155.8,
              "total_sales": 535.8,
              "percent": 45
            },
            {
              "id": 2,
              "product": "Lux Soap",
              "category": "Soap",
              "units_sold": 2,
              "gross_sales": 200,
              "discounts": 0,
              "net_sales": 200,
              "sales_tax": 36,
              "product_tax": 36,
              "category_tax": 20,
              "tax": 92,
              "total_sales": 292,
              "percent": 24
            },
            {
              "id": "custom:AA Batteries (pair)",
              "product": "AA Batteries (pair)",
              "category": "Electronics",
              "units_sold": 2,
              "gross_sales": 160,
              "discounts": 0,
              "net_sales": 160,
              "sales_tax": 28.8,
              "product_tax": 0,
              "category_tax": 0,
              "tax": 28.8,
              "total_sales": 188.8,
              "percent": 16
            },
            {
              "id": "custom:Tissue Box",
              "product": "Tissue Box",
              "category": "Household",
              "units_sold": 1,
              "gross_sales": 150,
              "discounts": 0,
              "net_sales": 150,
              "sales_tax": 27,
              "product_tax": 0,
              "category_tax": 0,
              "tax": 27,
              "total_sales": 177,
              "percent": 15
            }
          ]
        },
        "by_category": {
          "rows": [
            {
              "category": "Beverages",
              "units_sold": 5,
              "gross_sales": 500,
              "discounts": 120,
              "net_sales": 380,
              "sales_tax": 68.4,
              "product_tax": 68.4,
              "category_tax": 19,
              "tax": 155.8,
              "total_sales": 535.8,
              "percent": 45
            },
            {
              "category": "Soap",
              "units_sold": 2,
              "gross_sales": 200,
              "discounts": 0,
              "net_sales": 200,
              "sales_tax": 36,
              "product_tax": 36,
              "category_tax": 20,
              "tax": 92,
              "total_sales": 292,
              "percent": 24
            },
            {
              "category": "Electronics",
              "units_sold": 2,
              "gross_sales": 160,
              "discounts": 0,
              "net_sales": 160,
              "sales_tax": 28.8,
              "product_tax": 0,
              "category_tax": 0,
              "tax": 28.8,
              "total_sales": 188.8,
              "percent": 16
            },
            {
              "category": "Household",
              "units_sold": 1,
              "gross_sales": 150,
              "discounts": 0,
              "net_sales": 150,
              "sales_tax": 27,
              "product_tax": 0,
              "category_tax": 0,
              "tax": 27,
              "total_sales": 177,
              "percent": 15
            }
          ]
        },
        "payments": {
          "rows": [
            {
              "method": "CASH",
              "transactions": 5,
              "gross_amount": 3643.67,
              "tax": 146.02,
              "refunds": 2585.14,
              "net_amount": 1058.53,
              "percent": 78
            },
            {
              "method": "CARD",
              "transactions": 2,
              "gross_amount": 233.24,
              "tax": 6.34,
              "refunds": 100,
              "net_amount": 133.24,
              "percent": 10
            },
            {
              "method": "EASYPAISA",
              "transactions": 1,
              "gross_amount": 111.88,
              "tax": 5.33,
              "refunds": 0,
              "net_amount": 111.88,
              "percent": 8
            },
            {
              "method": "JAZZCASH",
              "transactions": 1,
              "gross_amount": 50,
              "tax": 2.38,
              "refunds": 0,
              "net_amount": 50,
              "percent": 4
            }
          ],
          "totals": {
            "transactions": 9,
            "gross_amount": 4038.79,
            "tax": 160.07,
            "refunds": 2685.14,
            "net_amount": 1353.65
          }
        },
        "z_reports": {
          "rows": [
            {
              "id": 1,
              "session_id": 1,
              "date_time": "2026-10-24T09:00:00.000Z",
              "closed_at": "2026-10-24T17:00:00.000Z",
              "status": "CLOSED",
              "cashier": "Ahmed Malik",
              "opening_amount": 5000,
              "orders": 6,
              "gross_sales": 1010,
              "discounts": 120,
              "net_sales": 890,
              "tax": 463.65,
              "refunds": 2685.14,
              "total_sales": 1353.65,
              "cash_sales": 1058.53,
              "card_sales": 133.24,
              "jazzcash_sales": 50,
              "easypaisa_sales": 111.88,
              "cash_in": 0,
              "cash_out": 0,
              "expected_cash": 6058.53,
              "counted_cash": 10000,
              "variance": 3941.47,
              "sales": 1353.65
            }
          ]
        },
        "inventory": {
          "rows": [
            {
              "id": 2,
              "product": "Lux Soap",
              "sku": "LUX-SOAP",
              "category": "Soap",
              "stock_in": 47,
              "stock_out": 27,
              "current_stock": 10
            },
            {
              "id": 2,
              "product": "Lux Soap",
              "sku": "LUX-SOAP",
              "category": "Soap",
              "stock_in": 47,
              "stock_out": 27,
              "current_stock": 10
            },
            {
              "id": 1,
              "product": "1 Litre Pepsi",
              "sku": "1-LITRE-PEPSI",
              "category": "Beverages",
              "stock_in": 100,
              "stock_out": 37,
              "current_stock": 22
            },
            {
              "id": 1,
              "product": "1 Litre Pepsi",
              "sku": "1-LITRE-PEPSI",
              "category": "Beverages",
              "stock_in": 100,
              "stock_out": 37,
              "current_stock": 41
            },
            {
              "id": 3,
              "product": "Basmati Rice",
              "sku": "BASMATI-RICE",
              "category": "Rice & Daal",
              "stock_in": 50,
              "stock_out": 0,
              "current_stock": 50
            }
          ]
        },
        "stock_movement": {
          "rows": [
            {
              "id": 4,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "SALE",
              "qty": -2,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 5,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "Lux Soap",
              "type": "SALE",
              "qty": -1,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 6,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "Lux Soap",
              "type": "SALE",
              "qty": -12,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 7,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "SALE",
              "qty": -1,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 8,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "SALE",
              "qty": -3,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 9,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "Lux Soap",
              "type": "SALE",
              "qty": -2,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 10,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "Lux Soap",
              "type": "REFUND",
              "qty": 12,
              "reason": "Refund",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 11,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "REFUND",
              "qty": 1,
              "reason": "Refund",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 12,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "REFUND",
              "qty": 1,
              "reason": "Refund",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 13,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "Lux Soap",
              "type": "REFUND",
              "qty": 1,
              "reason": "Refund",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 14,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "SALE",
              "qty": -1,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 15,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "REFUND",
              "qty": 1,
              "reason": "Refund",
              "channel": "both",
              "cashier": "Zayan Ahmed"
            },
            {
              "id": 16,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "SALE",
              "qty": -1,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 17,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "SALE",
              "qty": -1,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 18,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "ADJUSTMENT",
              "qty": -2,
              "reason": "Count",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 19,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "Lux Soap",
              "type": "STOCK_OUT",
              "qty": -2,
              "reason": "Damage",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 20,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "STOCK_IN",
              "qty": 24,
              "reason": "Purchase",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 21,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "Basmati Rice",
              "type": "STOCK_IN",
              "qty": 50,
              "reason": "Purchase",
              "channel": "pos",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 22,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "TRANSFER_OUT",
              "qty": -24,
              "reason": "Transfer",
              "channel": "both",
              "cashier": "Zayan Ahmed"
            },
            {
              "id": 23,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "TRANSFER_IN",
              "qty": 22,
              "reason": "Transfer",
              "channel": "both",
              "cashier": "Zayan Ahmed"
            },
            {
              "id": 24,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "Lux Soap",
              "type": "TRANSFER_OUT",
              "qty": -10,
              "reason": "Transfer",
              "channel": "both",
              "cashier": "Zayan Ahmed"
            },
            {
              "id": 25,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "Lux Soap",
              "type": "TRANSFER_IN",
              "qty": 10,
              "reason": "Transfer",
              "channel": "both",
              "cashier": "Zayan Ahmed"
            },
            {
              "id": 26,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "REFUND",
              "qty": 1,
              "reason": "Refund",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 1,
              "date": "2026-10-31T09:27:35.000Z",
              "product": "1 Litre Pepsi",
              "type": "STOCK_IN",
              "qty": 50,
              "reason": "Purchase",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 2,
              "date": "2026-10-31T09:27:35.000Z",
              "product": "Lux Soap",
              "type": "STOCK_IN",
              "qty": 24,
              "reason": "Opening Balance",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 3,
              "date": "2026-10-31T09:27:35.000Z",
              "product": "1 Litre Pepsi",
              "type": "STOCK_OUT",
              "qty": -2,
              "reason": "Damage",
              "channel": "both",
              "cashier": "Ahmed Malik"
            }
          ]
        },
        "refund_void": {
          "rows": [
            {
              "id": 6,
              "type": "refund",
              "date": "2026-10-31T09:27:36.000Z",
              "order_number": 1,
              "channel": "pos",
              "amount": 169.37,
              "reason": "Damaged item",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 5,
              "type": "refund",
              "date": "2026-10-31T09:27:36.000Z",
              "order_number": 1,
              "channel": "pos",
              "amount": 147.2,
              "reason": "Customer return",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 1,
              "type": "refund",
              "date": "2026-10-31T09:27:36.000Z",
              "order_number": 2,
              "channel": "pos",
              "amount": 136.88,
              "reason": "Full return",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 2,
              "type": "refund",
              "date": "2026-10-31T09:27:36.000Z",
              "order_number": 2,
              "channel": "pos",
              "amount": 164.26,
              "reason": "Full return",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 3,
              "type": "refund",
              "date": "2026-10-31T09:27:36.000Z",
              "order_number": 3,
              "channel": "pos",
              "amount": 1920.97,
              "reason": "Customer changed mind",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 4,
              "type": "refund",
              "date": "2026-10-31T09:27:36.000Z",
              "order_number": 3,
              "channel": "pos",
              "amount": 146.46,
              "reason": "Customer changed mind",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 6,
              "type": "void",
              "date": "2026-10-31T09:27:36.000Z",
              "order_number": 6,
              "channel": "pos",
              "amount": 147.2,
              "reason": "Customer left",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 8,
              "type": "void",
              "date": "2026-10-31T09:27:36.000Z",
              "order_number": 8,
              "channel": "pos",
              "amount": 147.2,
              "reason": "Rung up twice",
              "cashier": "Ahmed Malik"
            }
          ],
          "totals": {
            "refunds": 6,
            "voids": 2,
            "cancelled": 0,
            "amount": 2979.54
          }
        },
        "refunded_orders": {
          "rows": [
            {
              "id": 6,
              "order_number": 1,
              "refund_type": "partial",
              "date": "2026-10-31T09:27:36.000Z",
              "amount": 100,
              "tax": 69.37,
              "total": 169.37,
              "reason": "Damaged item",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 5,
              "order_number": 1,
              "refund_type": "partial",
              "date": "2026-10-31T09:27:36.000Z",
              "amount": 90,
              "tax": 57.2,
              "total": 147.2,
              "reason": "Customer return",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 1,
              "order_number": 2,
              "refund_type": "complete",
              "date": "2026-10-31T09:27:36.000Z",
              "amount": 100,
              "tax": 36.88,
              "total": 136.88,
              "reason": "Full return",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 2,
              "order_number": 2,
              "refund_type": "complete",
              "date": "2026-10-31T09:27:36.000Z",
              "amount": 120,
              "tax": 44.26,
              "total": 164.26,
              "reason": "Full return",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 3,
              "order_number": 3,
              "refund_type": "complete",
              "date": "2026-10-31T09:27:36.000Z",
              "amount": 1140,
              "tax": 780.97,
              "total": 1920.97,
              "reason": "Customer changed mind",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 4,
              "order_number": 3,
              "refund_type": "complete",
              "date": "2026-10-31T09:27:36.000Z",
              "amount": 90,
              "tax": 56.46,
              "total": 146.46,
              "reason": "Customer changed mind",
              "cashier": "Ahmed Malik"
            }
          ],
          "totals": {
            "refunds": 6,
            "complete": 4,
            "partial": 2,
            "orders": 3,
            "amount": 1640,
            "tax": 1045.14,
            "total": 2685.14
          }
        },
        "cancelled_orders": {
          "rows": [
            {
              "id": 6,
              "status": "voided",
              "date": "2026-10-31T09:27:36.000Z",
              "amount": 147.2,
              "reason": "Customer left",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 8,
              "status": "voided",
              "date": "2026-10-31T09:27:36.000Z",
              "amount": 147.2,
              "reason": "Rung up twice",
              "cashier": "Ahmed Malik"
            }
          ],
          "totals": {
            "orders": 2,
            "voided": 2,
            "cancelled": 0,
            "amount": 294.4
          }
        },
        "by_cashier": {
          "rows": [
            {
              "id": 2,
              "cashier": "Ahmed Malik",
              "orders": 6,
              "total_sales": 4038.79,
              "discounts": 200,
              "tax": 1508.79,
              "refunds": 2685.14,
              "net_sales": 1353.65
            }
          ]
        },
        "by_offer": {
          "rows": [
            {
              "offer": {
                "id": 3,
                "name": "Buy 2 get 1 free",
                "type": "bogo"
              },
              "units": 3,
              "free_units": 1,
              "discount_given": 100,
              "sales": 282,
              "orders": 1
            },
            {
              "offer": {
                "id": 1,
                "name": "Weekend 10% off",
                "type": "promotional"
              },
              "units": 2,
              "free_units": 0,
              "discount_given": 20,
              "sales": 253.8,
              "orders": 2
            }
          ],
          "totals": {
            "offers": 2,
            "discount_given": 120,
            "sales": 535.8
          }
        },
        "tax_breakdown": {
          "totals": {
            "orders": 4,
            "net_sales": 890,
            "tax_collected": 463.65,
            "total_sales": 1353.65,
            "taxes": {
              "sales_tax": 160.2,
              "product_tax": 104.4,
              "category_tax": 39,
              "payment_method_tax": {
                "cash": 146,
                "card": 6.34,
                "jazzcash": 2.38,
                "easypaisa": 5.33,
                "total": 160.05
              },
              "total": 463.65
            },
            "tax_collection": {
              "product_tax": 104.4,
              "category_tax": 39,
              "default_store_tax": 160.2,
              "payment_gst": 160.05,
              "payment_gst_cash": 146,
              "payment_gst_card": 6.34,
              "payment_gst_jazzcash": 2.38,
              "payment_gst_easypaisa": 5.33,
              "total": 463.65
            },
            "fbr_reported": 0
          },
          "rows": [
            {
              "id": "sales_tax",
              "tax_rule": "Sales Tax",
              "tax_collected": 160.2
            },
            {
              "id": "product_tax",
              "tax_rule": "Product Level Tax",
              "tax_collected": 104.4
            },
            {
              "id": "category_tax",
              "tax_rule": "Category Level Tax",
              "tax_collected": 39
            },
            {
              "id": "payment_tax_cash",
              "tax_rule": "Payment Method Tax (Cash)",
              "tax_collected": 146
            },
            {
              "id": "payment_tax_card",
              "tax_rule": "Payment Method Tax (Card)",
              "tax_collected": 6.34
            },
            {
              "id": "payment_tax_jazzcash",
              "tax_rule": "Payment Method Tax (JazzCash)",
              "tax_collected": 2.38
            },
            {
              "id": "payment_tax_easypaisa",
              "tax_rule": "Payment Method Tax (EasyPaisa)",
              "tax_collected": 5.33
            },
            {
              "id": "payment_tax",
              "tax_rule": "Payment Method Tax (total)",
              "tax_collected": 160.05
            },
            {
              "id": "total",
              "tax_rule": "Total Tax",
              "tax_collected": 463.65
            }
          ]
        },
        "by_location": {
          "rows": [
            {
              "location": {
                "id": 1,
                "name": "Gulshan e Iqbal Block 13 D"
              },
              "orders": 4,
              "gross_sales": 1010,
              "discounts": 120,
              "net_sales": 890,
              "tax": 463.65,
              "refunds": 2685.14,
              "total_sales": 1353.65,
              "percent": 100
            }
          ]
        }
      }
    }
  }],
  "rep-location": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": {
        "period": "daily",
        "locationId": 1,
        "from": null,
        "to": null,
        "sales_summary": {
          "totals": {
            "orders": 4,
            "units_sold": 10,
            "gross_sales": 1010,
            "line_discounts": 120,
            "order_discounts": 0,
            "discounts": 120,
            "net_sales": 890,
            "taxes": {
              "sales_tax": 160.2,
              "product_tax": 104.4,
              "category_tax": 39,
              "payment_method_tax": {
                "cash": 146,
                "card": 6.34,
                "jazzcash": 2.38,
                "easypaisa": 5.33,
                "total": 160.05
              },
              "total": 463.65
            },
            "shipping": 0,
            "total_sales": 1353.65,
            "total_collected": 4038.79,
            "on_credit": 0,
            "refunds": 2685.14,
            "refunded_tax": 1045.14,
            "refunded_orders": 2,
            "refunded_items": 18,
            "voided_orders": 2,
            "cancelled_orders": 0,
            "cost": 400,
            "discounts_by_source": {
              "product": 0,
              "category": 0,
              "product+category": 0,
              "bulk_tier": 0,
              "offer": 120,
              "custom": 0,
              "unknown": 0
            },
            "tax": 463.65,
            "revenue": 890,
            "tax_collection": {
              "product_tax": 104.4,
              "category_tax": 39,
              "default_store_tax": 160.2,
              "payment_gst": 160.05,
              "payment_gst_cash": 146,
              "payment_gst_card": 6.34,
              "payment_gst_jazzcash": 2.38,
              "payment_gst_easypaisa": 5.33,
              "total": 463.65
            },
            "gross_profit": 490,
            "avg_order_value": 338.41,
            "payments_net": 1353.65
          },
          "trend": [
            {
              "bucket": "2026-10-24",
              "sales": 1220.41,
              "orders": 3
            },
            {
              "bucket": "2026-10-31",
              "sales": 133.24,
              "orders": 1
            }
          ],
          "payments": [
            {
              "method": "CASH",
              "transactions": 5,
              "gross_amount": 3643.67,
              "tax": 146.02,
              "refunds": 2585.14,
              "net_amount": 1058.53,
              "percent": 78
            },
            {
              "method": "CARD",
              "transactions": 2,
              "gross_amount": 233.24,
              "tax": 6.34,
              "refunds": 100,
              "net_amount": 133.24,
              "percent": 10
            },
            {
              "method": "EASYPAISA",
              "transactions": 1,
              "gross_amount": 111.88,
              "tax": 5.33,
              "refunds": 0,
              "net_amount": 111.88,
              "percent": 8
            },
            {
              "method": "JAZZCASH",
              "transactions": 1,
              "gross_amount": 50,
              "tax": 2.38,
              "refunds": 0,
              "net_amount": 50,
              "percent": 4
            }
          ]
        },
        "by_product": {
          "rows": [
            {
              "id": 1,
              "product": "1 Litre Pepsi",
              "category": "Beverages",
              "units_sold": 5,
              "gross_sales": 500,
              "discounts": 120,
              "net_sales": 380,
              "sales_tax": 68.4,
              "product_tax": 68.4,
              "category_tax": 19,
              "tax": 155.8,
              "total_sales": 535.8,
              "percent": 45
            },
            {
              "id": 2,
              "product": "Lux Soap",
              "category": "Soap",
              "units_sold": 2,
              "gross_sales": 200,
              "discounts": 0,
              "net_sales": 200,
              "sales_tax": 36,
              "product_tax": 36,
              "category_tax": 20,
              "tax": 92,
              "total_sales": 292,
              "percent": 24
            },
            {
              "id": "custom:AA Batteries (pair)",
              "product": "AA Batteries (pair)",
              "category": "Electronics",
              "units_sold": 2,
              "gross_sales": 160,
              "discounts": 0,
              "net_sales": 160,
              "sales_tax": 28.8,
              "product_tax": 0,
              "category_tax": 0,
              "tax": 28.8,
              "total_sales": 188.8,
              "percent": 16
            },
            {
              "id": "custom:Tissue Box",
              "product": "Tissue Box",
              "category": "Household",
              "units_sold": 1,
              "gross_sales": 150,
              "discounts": 0,
              "net_sales": 150,
              "sales_tax": 27,
              "product_tax": 0,
              "category_tax": 0,
              "tax": 27,
              "total_sales": 177,
              "percent": 15
            }
          ]
        },
        "by_category": {
          "rows": [
            {
              "category": "Beverages",
              "units_sold": 5,
              "gross_sales": 500,
              "discounts": 120,
              "net_sales": 380,
              "sales_tax": 68.4,
              "product_tax": 68.4,
              "category_tax": 19,
              "tax": 155.8,
              "total_sales": 535.8,
              "percent": 45
            },
            {
              "category": "Soap",
              "units_sold": 2,
              "gross_sales": 200,
              "discounts": 0,
              "net_sales": 200,
              "sales_tax": 36,
              "product_tax": 36,
              "category_tax": 20,
              "tax": 92,
              "total_sales": 292,
              "percent": 24
            },
            {
              "category": "Electronics",
              "units_sold": 2,
              "gross_sales": 160,
              "discounts": 0,
              "net_sales": 160,
              "sales_tax": 28.8,
              "product_tax": 0,
              "category_tax": 0,
              "tax": 28.8,
              "total_sales": 188.8,
              "percent": 16
            },
            {
              "category": "Household",
              "units_sold": 1,
              "gross_sales": 150,
              "discounts": 0,
              "net_sales": 150,
              "sales_tax": 27,
              "product_tax": 0,
              "category_tax": 0,
              "tax": 27,
              "total_sales": 177,
              "percent": 15
            }
          ]
        },
        "payments": {
          "rows": [
            {
              "method": "CASH",
              "transactions": 5,
              "gross_amount": 3643.67,
              "tax": 146.02,
              "refunds": 2585.14,
              "net_amount": 1058.53,
              "percent": 78
            },
            {
              "method": "CARD",
              "transactions": 2,
              "gross_amount": 233.24,
              "tax": 6.34,
              "refunds": 100,
              "net_amount": 133.24,
              "percent": 10
            },
            {
              "method": "EASYPAISA",
              "transactions": 1,
              "gross_amount": 111.88,
              "tax": 5.33,
              "refunds": 0,
              "net_amount": 111.88,
              "percent": 8
            },
            {
              "method": "JAZZCASH",
              "transactions": 1,
              "gross_amount": 50,
              "tax": 2.38,
              "refunds": 0,
              "net_amount": 50,
              "percent": 4
            }
          ],
          "totals": {
            "transactions": 9,
            "gross_amount": 4038.79,
            "tax": 160.07,
            "refunds": 2685.14,
            "net_amount": 1353.65
          }
        },
        "z_reports": {
          "rows": [
            {
              "id": 1,
              "session_id": 1,
              "date_time": "2026-10-24T09:00:00.000Z",
              "closed_at": "2026-10-24T17:00:00.000Z",
              "status": "CLOSED",
              "cashier": "Ahmed Malik",
              "opening_amount": 5000,
              "orders": 6,
              "gross_sales": 1010,
              "discounts": 120,
              "net_sales": 890,
              "tax": 463.65,
              "refunds": 2685.14,
              "total_sales": 1353.65,
              "cash_sales": 1058.53,
              "card_sales": 133.24,
              "jazzcash_sales": 50,
              "easypaisa_sales": 111.88,
              "cash_in": 0,
              "cash_out": 0,
              "expected_cash": 6058.53,
              "counted_cash": 10000,
              "variance": 3941.47,
              "sales": 1353.65
            }
          ]
        },
        "inventory": {
          "rows": [
            {
              "id": 2,
              "product": "Lux Soap",
              "sku": "LUX-SOAP",
              "category": "Soap",
              "stock_in": 37,
              "stock_out": 27,
              "current_stock": 10
            },
            {
              "id": 1,
              "product": "1 Litre Pepsi",
              "sku": "1-LITRE-PEPSI",
              "category": "Beverages",
              "stock_in": 78,
              "stock_out": 37,
              "current_stock": 41
            },
            {
              "id": 3,
              "product": "Basmati Rice",
              "sku": "BASMATI-RICE",
              "category": "Rice & Daal",
              "stock_in": 50,
              "stock_out": 0,
              "current_stock": 50
            }
          ]
        },
        "stock_movement": {
          "rows": [
            {
              "id": 21,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "Basmati Rice",
              "type": "STOCK_IN",
              "qty": 50,
              "reason": "Purchase",
              "channel": "pos",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 4,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "SALE",
              "qty": -2,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 19,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "Lux Soap",
              "type": "STOCK_OUT",
              "qty": -2,
              "reason": "Damage",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 6,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "Lux Soap",
              "type": "SALE",
              "qty": -12,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 15,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "REFUND",
              "qty": 1,
              "reason": "Refund",
              "channel": "both",
              "cashier": "Zayan Ahmed"
            },
            {
              "id": 18,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "ADJUSTMENT",
              "qty": -2,
              "reason": "Count",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 8,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "SALE",
              "qty": -3,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 10,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "Lux Soap",
              "type": "REFUND",
              "qty": 12,
              "reason": "Refund",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 22,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "TRANSFER_OUT",
              "qty": -24,
              "reason": "Transfer",
              "channel": "both",
              "cashier": "Zayan Ahmed"
            },
            {
              "id": 13,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "Lux Soap",
              "type": "REFUND",
              "qty": 1,
              "reason": "Refund",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 9,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "Lux Soap",
              "type": "SALE",
              "qty": -2,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 24,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "Lux Soap",
              "type": "TRANSFER_OUT",
              "qty": -10,
              "reason": "Transfer",
              "channel": "both",
              "cashier": "Zayan Ahmed"
            },
            {
              "id": 7,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "SALE",
              "qty": -1,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 20,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "STOCK_IN",
              "qty": 24,
              "reason": "Purchase",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 26,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "REFUND",
              "qty": 1,
              "reason": "Refund",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 12,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "REFUND",
              "qty": 1,
              "reason": "Refund",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 11,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "REFUND",
              "qty": 1,
              "reason": "Refund",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 16,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "SALE",
              "qty": -1,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 5,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "Lux Soap",
              "type": "SALE",
              "qty": -1,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 14,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "SALE",
              "qty": -1,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 17,
              "date": "2026-10-31T09:27:36.000Z",
              "product": "1 Litre Pepsi",
              "type": "SALE",
              "qty": -1,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 2,
              "date": "2026-10-31T09:27:35.000Z",
              "product": "Lux Soap",
              "type": "STOCK_IN",
              "qty": 24,
              "reason": "Opening Balance",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 1,
              "date": "2026-10-31T09:27:35.000Z",
              "product": "1 Litre Pepsi",
              "type": "STOCK_IN",
              "qty": 50,
              "reason": "Purchase",
              "channel": "both",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 3,
              "date": "2026-10-31T09:27:35.000Z",
              "product": "1 Litre Pepsi",
              "type": "STOCK_OUT",
              "qty": -2,
              "reason": "Damage",
              "channel": "both",
              "cashier": "Ahmed Malik"
            }
          ]
        },
        "refund_void": {
          "rows": [
            {
              "id": 6,
              "type": "refund",
              "date": "2026-10-31T09:27:36.000Z",
              "order_number": 1,
              "channel": "pos",
              "amount": 169.37,
              "reason": "Damaged item",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 5,
              "type": "refund",
              "date": "2026-10-31T09:27:36.000Z",
              "order_number": 1,
              "channel": "pos",
              "amount": 147.2,
              "reason": "Customer return",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 1,
              "type": "refund",
              "date": "2026-10-31T09:27:36.000Z",
              "order_number": 2,
              "channel": "pos",
              "amount": 136.88,
              "reason": "Full return",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 2,
              "type": "refund",
              "date": "2026-10-31T09:27:36.000Z",
              "order_number": 2,
              "channel": "pos",
              "amount": 164.26,
              "reason": "Full return",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 3,
              "type": "refund",
              "date": "2026-10-31T09:27:36.000Z",
              "order_number": 3,
              "channel": "pos",
              "amount": 1920.97,
              "reason": "Customer changed mind",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 4,
              "type": "refund",
              "date": "2026-10-31T09:27:36.000Z",
              "order_number": 3,
              "channel": "pos",
              "amount": 146.46,
              "reason": "Customer changed mind",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 6,
              "type": "void",
              "date": "2026-10-31T09:27:36.000Z",
              "order_number": 6,
              "channel": "pos",
              "amount": 147.2,
              "reason": "Customer left",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 8,
              "type": "void",
              "date": "2026-10-31T09:27:36.000Z",
              "order_number": 8,
              "channel": "pos",
              "amount": 147.2,
              "reason": "Rung up twice",
              "cashier": "Ahmed Malik"
            }
          ],
          "totals": {
            "refunds": 6,
            "voids": 2,
            "cancelled": 0,
            "amount": 2979.54
          }
        },
        "refunded_orders": {
          "rows": [
            {
              "id": 6,
              "order_number": 1,
              "refund_type": "partial",
              "date": "2026-10-31T09:27:36.000Z",
              "amount": 100,
              "tax": 69.37,
              "total": 169.37,
              "reason": "Damaged item",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 5,
              "order_number": 1,
              "refund_type": "partial",
              "date": "2026-10-31T09:27:36.000Z",
              "amount": 90,
              "tax": 57.2,
              "total": 147.2,
              "reason": "Customer return",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 1,
              "order_number": 2,
              "refund_type": "complete",
              "date": "2026-10-31T09:27:36.000Z",
              "amount": 100,
              "tax": 36.88,
              "total": 136.88,
              "reason": "Full return",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 2,
              "order_number": 2,
              "refund_type": "complete",
              "date": "2026-10-31T09:27:36.000Z",
              "amount": 120,
              "tax": 44.26,
              "total": 164.26,
              "reason": "Full return",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 3,
              "order_number": 3,
              "refund_type": "complete",
              "date": "2026-10-31T09:27:36.000Z",
              "amount": 1140,
              "tax": 780.97,
              "total": 1920.97,
              "reason": "Customer changed mind",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 4,
              "order_number": 3,
              "refund_type": "complete",
              "date": "2026-10-31T09:27:36.000Z",
              "amount": 90,
              "tax": 56.46,
              "total": 146.46,
              "reason": "Customer changed mind",
              "cashier": "Ahmed Malik"
            }
          ],
          "totals": {
            "refunds": 6,
            "complete": 4,
            "partial": 2,
            "orders": 3,
            "amount": 1640,
            "tax": 1045.14,
            "total": 2685.14
          }
        },
        "cancelled_orders": {
          "rows": [
            {
              "id": 6,
              "status": "voided",
              "date": "2026-10-31T09:27:36.000Z",
              "amount": 147.2,
              "reason": "Customer left",
              "cashier": "Ahmed Malik"
            },
            {
              "id": 8,
              "status": "voided",
              "date": "2026-10-31T09:27:36.000Z",
              "amount": 147.2,
              "reason": "Rung up twice",
              "cashier": "Ahmed Malik"
            }
          ],
          "totals": {
            "orders": 2,
            "voided": 2,
            "cancelled": 0,
            "amount": 294.4
          }
        },
        "by_cashier": {
          "rows": [
            {
              "id": 2,
              "cashier": "Ahmed Malik",
              "orders": 6,
              "total_sales": 4038.79,
              "discounts": 200,
              "tax": 1508.79,
              "refunds": 2685.14,
              "net_sales": 1353.65
            }
          ]
        },
        "by_offer": {
          "rows": [
            {
              "offer": {
                "id": 3,
                "name": "Buy 2 get 1 free",
                "type": "bogo"
              },
              "units": 3,
              "free_units": 1,
              "discount_given": 100,
              "sales": 282,
              "orders": 1
            },
            {
              "offer": {
                "id": 1,
                "name": "Weekend 10% off",
                "type": "promotional"
              },
              "units": 2,
              "free_units": 0,
              "discount_given": 20,
              "sales": 253.8,
              "orders": 2
            }
          ],
          "totals": {
            "offers": 2,
            "discount_given": 120,
            "sales": 535.8
          }
        },
        "tax_breakdown": {
          "totals": {
            "orders": 4,
            "net_sales": 890,
            "tax_collected": 463.65,
            "total_sales": 1353.65,
            "taxes": {
              "sales_tax": 160.2,
              "product_tax": 104.4,
              "category_tax": 39,
              "payment_method_tax": {
                "cash": 146,
                "card": 6.34,
                "jazzcash": 2.38,
                "easypaisa": 5.33,
                "total": 160.05
              },
              "total": 463.65
            },
            "tax_collection": {
              "product_tax": 104.4,
              "category_tax": 39,
              "default_store_tax": 160.2,
              "payment_gst": 160.05,
              "payment_gst_cash": 146,
              "payment_gst_card": 6.34,
              "payment_gst_jazzcash": 2.38,
              "payment_gst_easypaisa": 5.33,
              "total": 463.65
            },
            "fbr_reported": 0
          },
          "rows": [
            {
              "id": "sales_tax",
              "tax_rule": "Sales Tax",
              "tax_collected": 160.2
            },
            {
              "id": "product_tax",
              "tax_rule": "Product Level Tax",
              "tax_collected": 104.4
            },
            {
              "id": "category_tax",
              "tax_rule": "Category Level Tax",
              "tax_collected": 39
            },
            {
              "id": "payment_tax_cash",
              "tax_rule": "Payment Method Tax (Cash)",
              "tax_collected": 146
            },
            {
              "id": "payment_tax_card",
              "tax_rule": "Payment Method Tax (Card)",
              "tax_collected": 6.34
            },
            {
              "id": "payment_tax_jazzcash",
              "tax_rule": "Payment Method Tax (JazzCash)",
              "tax_collected": 2.38
            },
            {
              "id": "payment_tax_easypaisa",
              "tax_rule": "Payment Method Tax (EasyPaisa)",
              "tax_collected": 5.33
            },
            {
              "id": "payment_tax",
              "tax_rule": "Payment Method Tax (total)",
              "tax_collected": 160.05
            },
            {
              "id": "total",
              "tax_rule": "Total Tax",
              "tax_collected": 463.65
            }
          ]
        }
      }
    }
  }],
  "rep-profit": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": {
        "period": "monthly",
        "totals": {
          "orders": 4,
          "sales_collected": 1353.65,
          "cost": 400,
          "discounts": 0,
          "refunds": 316.57,
          "tax_collection": {
            "product_tax": 104.4,
            "category_tax": 39,
            "default_store_tax": 160.2,
            "payment_gst": 160.05,
            "payment_gst_cash": 146,
            "payment_gst_card": 6.34,
            "payment_gst_jazzcash": 2.38,
            "payment_gst_easypaisa": 5.33,
            "fbr": 0,
            "total": 463.65
          },
          "tax": 463.65,
          "gross_profit": 490
        }
      }
    }
  }],
  "batch-list": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": [
        {
          "id": 1,
          "staff": {
            "id": 2,
            "name": "Ahmed Malik",
            "role": "manager"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "status": "closed",
          "opening_amount": 5000,
          "opening_at": "2026-10-24T09:00:00.000Z",
          "cash_sales": 1058.53,
          "card_sales": 133.24,
          "jazzcash_sales": 50,
          "easypaisa_sales": 111.88,
          "total_sales": 1353.65,
          "expected_cash": 6058.53,
          "total_cash": 10000,
          "cash_variance": 3941.47,
          "closing_at": "2026-10-24T17:00:00.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 1,
        "total_pages": 1
      }
    }
  }],
  "order-history": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": [
        {
          "id": 8,
          "is_custom": false,
          "location_name": "Gulshan e Iqbal Block 13 D",
          "items": 1,
          "currency": "PKR",
          "total_amount": 147.2,
          "status": "voided",
          "payment_status": "refunded",
          "remaining_amount": 0,
          "placed_at": "2026-10-31T09:27:36.000Z",
          "channel": "pos"
        },
        {
          "id": 7,
          "is_custom": false,
          "location_name": "Gulshan e Iqbal Block 13 D",
          "items": 1,
          "currency": "PKR",
          "total_amount": 133.24,
          "status": "completed",
          "payment_status": "paid",
          "remaining_amount": 0,
          "placed_at": "2026-10-31T09:27:36.000Z",
          "channel": "pos"
        },
        {
          "id": 6,
          "is_custom": false,
          "location_name": "Gulshan e Iqbal Block 13 D",
          "items": 1,
          "currency": "PKR",
          "total_amount": 147.2,
          "status": "voided",
          "payment_status": "refunded",
          "remaining_amount": 0,
          "placed_at": "2026-10-31T09:27:36.000Z",
          "channel": "pos"
        },
        {
          "id": 5,
          "is_custom": false,
          "location_name": "Gulshan e Iqbal Block 13 D",
          "items": 2,
          "currency": "PKR",
          "total_amount": 654.12,
          "status": "completed",
          "payment_status": "paid",
          "remaining_amount": 0,
          "placed_at": "2026-10-24T13:30:00.000Z",
          "channel": "pos"
        },
        {
          "id": 4,
          "is_custom": true,
          "location_name": "Gulshan e Iqbal Block 13 D",
          "items": 2,
          "currency": "PKR",
          "total_amount": 419.09,
          "status": "completed",
          "payment_status": "paid",
          "remaining_amount": 0,
          "placed_at": "2026-10-24T12:15:00.000Z",
          "channel": "pos"
        },
        {
          "id": 3,
          "is_custom": false,
          "location_name": "Gulshan e Iqbal Block 13 D",
          "items": 2,
          "currency": "PKR",
          "total_amount": 2067.43,
          "status": "refunded",
          "payment_status": "refunded",
          "remaining_amount": 0,
          "placed_at": "2026-10-24T11:40:00.000Z",
          "channel": "pos"
        },
        {
          "id": 2,
          "is_custom": true,
          "location_name": "Gulshan e Iqbal Block 13 D",
          "items": 2,
          "currency": "PKR",
          "total_amount": 301.14,
          "status": "refunded",
          "payment_status": "refunded",
          "remaining_amount": 0,
          "placed_at": "2026-10-24T10:20:00.000Z",
          "channel": "pos"
        },
        {
          "id": 1,
          "is_custom": false,
          "location_name": "Gulshan e Iqbal Block 13 D",
          "items": 2,
          "currency": "PKR",
          "total_amount": 463.77,
          "status": "partial_refunded",
          "payment_status": "paid",
          "remaining_amount": 0,
          "placed_at": "2026-10-24T10:05:00.000Z",
          "channel": "pos"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 8,
        "total_pages": 1
      }
    }
  }],
  "staff-list": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": [
        {
          "id": 2,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "name": "Ahmed Malik",
          "email": "ahmed@acadex.co",
          "pin": "2222",
          "role": "manager",
          "phone": null,
          "status": "clock_out",
          "is_active": true
        },
        {
          "id": 3,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "name": "Ameer Hamza",
          "email": "ameer@acadex.co",
          "pin": "3333",
          "role": "cashier",
          "phone": "03001112222",
          "status": "clock_out",
          "is_active": true
        },
        {
          "id": 4,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "name": "Yasir Ali Khan",
          "email": "yasir@acadex.co",
          "pin": "4545",
          "role": "cashier",
          "phone": "03004445555",
          "status": "clock_out",
          "is_active": true
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 3,
        "total_pages": 1
      }
    }
  }],
  "tax-get": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": {
        "ntn": "1234567-8",
        "strn": "3277876123456",
        "charge_tax_on_sales": true,
        "sales_tax_enabled": true,
        "sales_tax_rate": 18,
        "payment_tax_enabled": true,
        "fbr_invoice_enabled": false,
        "rates": [
          {
            "payment_method": "cash",
            "gst_percent": 16
          },
          {
            "payment_method": "card",
            "gst_percent": 5
          },
          {
            "payment_method": "jazzcash",
            "gst_percent": 5
          },
          {
            "payment_method": "easypaisa",
            "gst_percent": 5
          }
        ]
      }
    }
  }],
  "transaction-list": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": [
        {
          "id": 11,
          "reference": null,
          "order": {
            "id": 8,
            "status": "voided"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "method": "cash",
          "amount": 147.2,
          "tax_amount": 20.3,
          "currency": "PKR",
          "status": "success",
          "paid_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 10,
          "reference": null,
          "order": {
            "id": 7,
            "status": "completed"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "method": "card",
          "amount": 133.24,
          "tax_amount": 6.34,
          "currency": "PKR",
          "status": "success",
          "paid_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 9,
          "reference": null,
          "order": {
            "id": 6,
            "status": "voided"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "method": "cash",
          "amount": 147.2,
          "tax_amount": 20.3,
          "currency": "PKR",
          "status": "success",
          "paid_at": "2026-10-31T09:27:36.000Z"
        },
        {
          "id": 8,
          "reference": null,
          "order": {
            "id": 5,
            "status": "completed"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "method": "cash",
          "amount": 542.24,
          "tax_amount": 74.79,
          "currency": "PKR",
          "status": "success",
          "paid_at": "2026-10-24T13:30:00.000Z"
        },
        {
          "id": 7,
          "reference": null,
          "order": {
            "id": 5,
            "status": "completed"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "method": "easypaisa",
          "amount": 111.88,
          "tax_amount": 5.33,
          "currency": "PKR",
          "status": "success",
          "paid_at": "2026-10-24T13:30:00.000Z"
        },
        {
          "id": 6,
          "reference": null,
          "order": {
            "id": 4,
            "status": "completed"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "method": "cash",
          "amount": 369.09,
          "tax_amount": 50.91,
          "currency": "PKR",
          "status": "success",
          "paid_at": "2026-10-24T12:15:00.000Z"
        },
        {
          "id": 5,
          "reference": null,
          "order": {
            "id": 4,
            "status": "completed"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "method": "jazzcash",
          "amount": 50,
          "tax_amount": 2.38,
          "currency": "PKR",
          "status": "success",
          "paid_at": "2026-10-24T12:15:00.000Z"
        },
        {
          "id": 4,
          "reference": null,
          "order": {
            "id": 3,
            "status": "refunded"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "method": "cash",
          "amount": 1967.43,
          "tax_amount": 271.37,
          "currency": "PKR",
          "status": "success",
          "paid_at": "2026-10-24T11:40:00.000Z"
        },
        {
          "id": 3,
          "reference": null,
          "order": {
            "id": 3,
            "status": "refunded"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "method": "card",
          "amount": 100,
          "tax_amount": 4.76,
          "currency": "PKR",
          "status": "success",
          "paid_at": "2026-10-24T11:40:00.000Z"
        },
        {
          "id": 2,
          "reference": null,
          "order": {
            "id": 2,
            "status": "refunded"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "method": "cash",
          "amount": 301.14,
          "tax_amount": 41.54,
          "currency": "PKR",
          "status": "success",
          "paid_at": "2026-10-24T10:20:00.000Z"
        },
        {
          "id": 1,
          "reference": null,
          "order": {
            "id": 1,
            "status": "partial_refunded"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "method": "cash",
          "amount": 463.77,
          "tax_amount": 63.97,
          "currency": "PKR",
          "status": "success",
          "paid_at": "2026-10-24T10:05:00.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 11,
        "total_pages": 1
      }
    }
  }],
  "order-receipt": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": {
        "id": 1,
        "order_id": 1,
        "store": {
          "name": "Acadex",
          "ntn": "1234567-8",
          "strn": "3277876123456"
        },
        "issued_at": "2026-10-24T10:05:00.000Z",
        "channel": "pos",
        "status": "partial_refunded",
        "payment_status": "paid",
        "payment_method": "cash",
        "location": {
          "id": 1,
          "name": "Gulshan e Iqbal Block 13 D"
        },
        "cashier": {
          "id": 2,
          "name": "Ahmed Malik"
        },
        "customer": null,
        "currency": "PKR",
        "items": [
          {
            "id": 1,
            "qty": 2,
            "unit_price": 100,
            "gross_amount": 200,
            "product": {
              "id": 1,
              "title": "1 Litre Pepsi",
              "sku": "1-LITRE-PEPSI",
              "barcode": "78263672323325",
              "discount": null,
              "taxes": [
                {
                  "name": "GST",
                  "type": "percentage",
                  "value": 18,
                  "amount": 32.4
                }
              ]
            },
            "category": {
              "id": 1,
              "name": "Beverages",
              "discount": null,
              "tax": {
                "name": "GST",
                "type": "percentage",
                "value": 5,
                "amount": 9
              }
            },
            "offer": {
              "id": 1,
              "name": "Weekend 10% off",
              "type": "promotional",
              "discount_type": "percentage",
              "discount_value": 10,
              "amount": 20
            },
            "sales_tax": {
              "rate": 18,
              "amount": 32.4
            },
            "discount_amount": 20,
            "subtotal": 180,
            "tax_amount": 73.8,
            "refunded_qty": 1,
            "total": 253.8
          },
          {
            "id": 2,
            "qty": 1,
            "unit_price": 100,
            "gross_amount": 100,
            "product": {
              "id": 2,
              "title": "Lux Soap",
              "sku": "LUX-SOAP",
              "barcode": "8961014001234",
              "discount": null,
              "taxes": [
                {
                  "name": "GST",
                  "type": "percentage",
                  "value": 18,
                  "amount": 18
                }
              ]
            },
            "category": {
              "id": 2,
              "name": "Soap",
              "discount": null,
              "tax": {
                "name": "GST",
                "type": "percentage",
                "value": 10,
                "amount": 10
              }
            },
            "offer": null,
            "sales_tax": {
              "rate": 18,
              "amount": 18
            },
            "discount_amount": 0,
            "subtotal": 100,
            "tax_amount": 46,
            "refunded_qty": 1,
            "total": 146
          }
        ],
        "subtotal": 280,
        "sales_tax": {
          "rate": 18,
          "amount": 50.4
        },
        "payment_gst_amount": 63.97,
        "tax_amount": 183.77,
        "total": 463.77,
        "amount_paid": 1000,
        "change_due": 536.23,
        "payments": [
          {
            "method": "cash",
            "gst_percent": 16,
            "gst_amount": 63.97,
            "amount": 463.77,
            "paid": 1000,
            "change": 536.23,
            "status": "success"
          }
        ]
      }
    }
  }],
  "refund-receipt": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": {
        "id": 6,
        "refund_id": 1,
        "order_id": 2,
        "refund_type": "complete",
        "reason": "Full return",
        "store": {
          "name": "Acadex",
          "ntn": "1234567-8",
          "strn": "3277876123456"
        },
        "issued_at": "2026-10-31T09:27:36.000Z",
        "location": {
          "id": 1,
          "name": "Gulshan e Iqbal Block 13 D"
        },
        "cashier": {
          "id": 2,
          "name": "Ahmed Malik"
        },
        "currency": "PKR",
        "items": [
          {
            "id": 1,
            "title": "SP10 Blue Pen",
            "sku": null,
            "qty": 2,
            "unit_price": 50,
            "total": 136.88
          }
        ],
        "subtotal": 100,
        "tax_amount": 36.88,
        "total": 136.88,
        "payments": [
          {
            "method": "cash",
            "amount": 136.88
          }
        ]
      }
    }
  }],
}
