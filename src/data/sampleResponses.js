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
        "starts_at": "2026-10-25T15:36:54.000Z",
        "expires_at": "2026-10-28T15:36:54.000Z",
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
        "created_at": "2026-10-25T15:36:55.274Z",
        "updated_at": "2026-10-25T15:36:55.274Z"
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
          "trial_ended_at": "2026-10-28T15:36:54.000Z"
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
        "id": 3,
        "name": "Ameer Hamza",
        "email": "ameer@acadex.co",
        "pin": "3333",
        "role": "cashier",
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
      "data": {
        "id": 1,
        "staff": {
          "id": 3,
          "name": "Ameer Hamza",
          "role": "cashier"
        },
        "location": {
          "id": 1,
          "name": "Gulshan e Iqbal Block 13 D"
        },
        "status": "clock_in",
        "opening_at": "2026-10-24T09:00:00.000Z"
      }
    }
  }],
  "batch-open": [{
    "label": "201 Created",
    "status": 201,
    "body": {
      "success": true,
      "message": "Batch Open",
      "data": {
        "id": 1,
        "staff": {
          "id": 3,
          "name": "Ameer Hamza",
          "role": "cashier"
        },
        "location": {
          "id": 1,
          "name": "Gulshan e Iqbal Block 13 D"
        },
        "opening_amount": 5000,
        "opening_at": "2026-10-25T15:36:55.766Z"
      }
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
          "total_pack_price": null
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
          "total_pack_price": 1416
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
          "total_pack_price": 9608
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
            "id": 1,
            "name": "Zayan Ahmed",
            "role": "store_admin"
          },
          "order": null,
          "movement_type": "stock_in",
          "reason": "purchase",
          "reason_note": null,
          "qty": 50,
          "qty_after": 50,
          "unit_sold": 0,
          "created_at": "2026-10-25T15:36:55.000Z"
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
            "id": 1,
            "name": "Zayan Ahmed",
            "role": "store_admin"
          },
          "order": null,
          "movement_type": "stock_in",
          "reason": "opening_balance",
          "reason_note": null,
          "qty": 24,
          "qty_after": 24,
          "unit_sold": 0,
          "created_at": "2026-10-25T15:36:55.000Z"
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
            "id": 1,
            "name": "Zayan Ahmed",
            "role": "store_admin"
          },
          "order": null,
          "movement_type": "stock_out",
          "reason": "damage",
          "reason_note": null,
          "qty": -2,
          "qty_after": 48,
          "unit_sold": 0,
          "created_at": "2026-10-25T15:36:55.000Z"
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
          "status": "on_the_way",
          "note": "Weekly refill",
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "created_at": "2026-10-25T15:36:55.903Z"
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
          "status": "on_the_way",
          "note": null,
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "created_at": "2026-10-25T15:36:55.911Z"
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
          "status": "on_the_way",
          "note": "Weekend stock",
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "created_at": "2026-10-25T15:36:55.919Z"
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
            },
            {
              "id": 2,
              "name": "Branch 2"
            }
          ],
          "is_active": true,
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
            },
            {
              "id": 2,
              "name": "Branch 2"
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
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
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
              "qty": 2,
              "unit_price": 100,
              "discount_amount": 20,
              "subtotal": 180,
              "tax_amount": 73.8,
              "total": 253.8
            },
            {
              "id": 2,
              "product": {
                "id": 2,
                "title": "Lux Soap",
                "sku": "LUX-SOAP",
                "unit": "piece"
              },
              "qty": 1,
              "unit_price": 100,
              "discount_amount": 0,
              "subtotal": 100,
              "tax_amount": 46,
              "total": 146
            }
          ],
          "subtotal": 349.4,
          "is_order_discounted": false,
          "order_discount_type": null,
          "discount_amount": 0,
          "payment_method": "cash",
          "payment_status": "paid",
          "payment_gst_amount": 63.97,
          "fbr_invoice_enabled": false,
          "fbr_tax_amount": 0,
          "order_status": "completed",
          "total_amount": 463.77,
          "amount_paid": 1000,
          "change_due": 536.23,
          "cancel_reason": null,
          "cancelled_by": null,
          "placed_at": "2026-10-25T15:36:56.000Z",
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
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
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
          "fbr_invoice_enabled": false,
          "fbr_tax_amount": 0,
          "order_status": "completed",
          "total_amount": 301.14,
          "amount_paid": 500,
          "change_due": 198.86,
          "cancel_reason": null,
          "cancelled_by": null,
          "placed_at": "2026-10-25T15:36:56.000Z",
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
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
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
              "qty": 12,
              "unit_price": 100,
              "discount_amount": 60,
              "subtotal": 1140,
              "tax_amount": 524.4,
              "total": 1664.4
            },
            {
              "id": 2,
              "product": {
                "id": 1,
                "title": "1 Litre Pepsi",
                "sku": "1-LITRE-PEPSI",
                "unit": "bottle"
              },
              "qty": 1,
              "unit_price": 100,
              "discount_amount": 10,
              "subtotal": 90,
              "tax_amount": 36.9,
              "total": 126.9
            }
          ],
          "subtotal": 1569.9,
          "is_order_discounted": false,
          "order_discount_type": null,
          "discount_amount": 0,
          "payment_method": "mixed",
          "payment_status": "paid",
          "payment_gst_amount": 277.09,
          "fbr_invoice_enabled": false,
          "fbr_tax_amount": 0,
          "order_status": "completed",
          "total_amount": 2068.39,
          "amount_paid": 3100,
          "change_due": 1031.61,
          "cancel_reason": null,
          "cancelled_by": null,
          "placed_at": "2026-10-25T15:36:56.000Z",
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
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
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
          "payment_gst_amount": 53.74,
          "fbr_invoice_enabled": false,
          "fbr_tax_amount": 0,
          "order_status": "completed",
          "total_amount": 419.54,
          "amount_paid": 550,
          "change_due": 130.46,
          "cancel_reason": null,
          "cancelled_by": null,
          "placed_at": "2026-10-25T15:36:56.000Z",
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
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
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
              "qty": 3,
              "unit_price": 100,
              "discount_amount": 100,
              "subtotal": 200,
              "tax_amount": 82,
              "total": 282
            },
            {
              "id": 2,
              "product": {
                "id": 2,
                "title": "Lux Soap",
                "sku": "LUX-SOAP",
                "unit": "piece"
              },
              "qty": 2,
              "unit_price": 100,
              "discount_amount": 0,
              "subtotal": 200,
              "tax_amount": 92,
              "total": 292
            }
          ],
          "subtotal": 502,
          "is_order_discounted": false,
          "order_discount_type": null,
          "discount_amount": 0,
          "payment_method": "mixed",
          "payment_status": "paid",
          "payment_gst_amount": 82.3,
          "fbr_invoice_enabled": false,
          "fbr_tax_amount": 0,
          "order_status": "completed",
          "total_amount": 656.3,
          "amount_paid": 1600,
          "change_due": 943.7,
          "cancel_reason": null,
          "cancelled_by": null,
          "placed_at": "2026-10-25T15:36:56.000Z",
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
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
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
          "refunded_at": "2026-10-25T15:36:56.000Z"
        },
        {
          "id": 3,
          "refund_type": "complete",
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
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
              "tax": 781.86
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
              "tax": 56.53
            }
          ],
          "amount": 1230,
          "tax": 838.39,
          "total": 2068.39,
          "refunded_at": "2026-10-25T15:36:56.000Z"
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
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "order": {
            "id": 1,
            "status": "completed"
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
          "refunded_at": "2026-10-25T15:36:56.000Z"
        },
        {
          "id": 6,
          "refund_type": "partial",
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "order": {
            "id": 1,
            "status": "completed"
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
              "tax": 69.36
            }
          ],
          "amount": 100,
          "tax": 69.36,
          "total": 169.36,
          "refunded_at": "2026-10-25T15:36:56.000Z"
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
          "id": 3,
          "name": "Ameer Hamza",
          "role": "cashier"
        },
        "location": {
          "id": 1,
          "name": "Gulshan e Iqbal Block 13 D"
        },
        "status": "open",
        "opening_amount": 5000,
        "opening_at": "2026-10-25T15:36:55.000Z",
        "cash_sales": 973.05,
        "card_sales": 100,
        "jazzcash_sales": 50,
        "easypaisa_sales": 100,
        "total_sales": 1223.05,
        "expected_cash": 5973.05,
        "total_cash": null,
        "cash_variance": null,
        "closing_at": null
      }
    }
  }],
  "batch-close": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Batch Closed",
      "data": {
        "id": 1,
        "staff": {
          "id": 3,
          "name": "Ameer Hamza",
          "role": "cashier"
        },
        "location": {
          "id": 1,
          "name": "Gulshan e Iqbal Block 13 D"
        },
        "total_cash": 10000,
        "closing_at": "2026-10-25T15:36:56.606Z"
      }
    }
  }],
  "staff-clock-out": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "Clock Out Session",
      "data": {
        "id": 1,
        "staff": {
          "id": 3,
          "name": "Ameer Hamza",
          "role": "cashier"
        },
        "location": {
          "id": 1,
          "name": "Gulshan e Iqbal Block 13 D"
        },
        "status": "clock_out",
        "closing_at": "2026-10-24T17:00:00.000Z"
      }
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
        "starts_at": "2026-10-25T15:36:56.628Z",
        "expires_at": "2026-11-25T15:36:56.628Z",
        "planId": 1,
        "renew_at": "2026-10-25T15:36:56.628Z"
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
          "id": "7c7dd7c2-0e98-4799-914f-9dc82f4e3d7f",
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
          "created_at": "2026-10-25T15:36:54.000Z",
          "updated_at": "2026-10-25T15:36:54.000Z"
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
        "created_at": "2026-10-25T15:36:54.000Z",
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
          "created_at": "2026-10-25T15:36:54.000Z",
          "updated_at": "2026-10-25T15:36:54.000Z"
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
          "created_at": "2026-10-25T15:36:55.000Z",
          "updated_at": "2026-10-25T15:36:55.000Z"
        },
        {
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
          "created_at": "2026-10-25T15:36:55.000Z",
          "updated_at": "2026-10-25T15:36:55.000Z"
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
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "status": "clock_out",
          "opening_at": "2026-10-24T09:00:00.000Z",
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
          "discount_value": 10,
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
          "qty": 44,
          "stocks": [
            {
              "location": {
                "id": 1,
                "name": "Gulshan e Iqbal Block 13 D"
              },
              "qty": 44,
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
          "qty": 0,
          "stocks": []
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
          "qty": 22,
          "stocks": [
            {
              "location": {
                "id": 1,
                "name": "Gulshan e Iqbal Block 13 D"
              },
              "qty": 22,
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
          "qty": 44,
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
          "qty": 22,
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
          "total_pack_price": 9608
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
          "id": 5,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "is_custom": false,
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "customer": null,
          "batch": {
            "id": 1,
            "status": "closed"
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
              "qty": 3,
              "unit_price": 100,
              "discount_amount": 100,
              "subtotal": 200,
              "tax_amount": 82,
              "total": 282
            },
            {
              "id": 2,
              "product": {
                "id": 2,
                "title": "Lux Soap",
                "sku": "LUX-SOAP",
                "unit": "piece"
              },
              "qty": 2,
              "unit_price": 100,
              "discount_amount": 0,
              "subtotal": 200,
              "tax_amount": 92,
              "total": 292
            }
          ],
          "subtotal": 502,
          "is_order_discounted": false,
          "order_discount_type": null,
          "discount_amount": 0,
          "payment_method": "mixed",
          "payment_status": "paid",
          "payment_gst_amount": 82.3,
          "fbr_invoice_enabled": false,
          "fbr_tax_amount": 0,
          "order_status": "completed",
          "total_amount": 656.3,
          "amount_paid": 1600,
          "change_due": 943.7,
          "cancel_reason": null,
          "cancelled_by": null,
          "placed_at": "2026-10-25T15:36:56.000Z",
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
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "customer": null,
          "batch": {
            "id": 1,
            "status": "closed"
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
          "payment_gst_amount": 53.74,
          "fbr_invoice_enabled": false,
          "fbr_tax_amount": 0,
          "order_status": "completed",
          "total_amount": 419.54,
          "amount_paid": 550,
          "change_due": 130.46,
          "cancel_reason": null,
          "cancelled_by": null,
          "placed_at": "2026-10-25T15:36:56.000Z",
          "channel": "pos",
          "is_pos_visible": true,
          "is_web_visible": false
        },
        {
          "id": 1,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "is_custom": false,
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "customer": null,
          "batch": {
            "id": 1,
            "status": "closed"
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
              "qty": 2,
              "unit_price": 100,
              "discount_amount": 20,
              "subtotal": 180,
              "tax_amount": 73.8,
              "total": 253.8
            },
            {
              "id": 2,
              "product": {
                "id": 2,
                "title": "Lux Soap",
                "sku": "LUX-SOAP",
                "unit": "piece"
              },
              "qty": 1,
              "unit_price": 100,
              "discount_amount": 0,
              "subtotal": 100,
              "tax_amount": 46,
              "total": 146
            }
          ],
          "subtotal": 349.4,
          "is_order_discounted": false,
          "order_discount_type": null,
          "discount_amount": 0,
          "payment_method": "cash",
          "payment_status": "paid",
          "payment_gst_amount": 63.97,
          "fbr_invoice_enabled": false,
          "fbr_tax_amount": 0,
          "order_status": "completed",
          "total_amount": 463.77,
          "amount_paid": 1000,
          "change_due": 536.23,
          "cancel_reason": null,
          "cancelled_by": null,
          "placed_at": "2026-10-25T15:36:56.000Z",
          "channel": "pos",
          "is_pos_visible": true,
          "is_web_visible": false
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
          "id": 6,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "is_custom": false,
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "customer": null,
          "batch": {
            "id": 1,
            "status": "closed"
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
              "qty": 1,
              "unit_price": 100,
              "discount_amount": 10,
              "subtotal": 90,
              "tax_amount": 36.9,
              "total": 126.9
            }
          ],
          "subtotal": 110.7,
          "is_order_discounted": false,
          "order_discount_type": null,
          "discount_amount": 0,
          "payment_method": "cash",
          "payment_status": "refunded",
          "payment_gst_amount": 20.3,
          "fbr_invoice_enabled": false,
          "fbr_tax_amount": 0,
          "order_status": "voided",
          "total_amount": 147.2,
          "amount_paid": 500,
          "change_due": 352.8,
          "cancel_reason": "Customer left",
          "cancelled_by": null,
          "placed_at": "2026-10-25T15:36:56.000Z",
          "channel": "pos",
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
  "order-get": [{
    "label": "200 OK",
    "status": 200,
    "body": {
      "success": true,
      "message": "OK",
      "data": {
        "id": 1,
        "location": {
          "id": 1,
          "name": "Gulshan e Iqbal Block 13 D"
        },
        "is_custom": false,
        "staff": {
          "id": 3,
          "name": "Ameer Hamza",
          "role": "cashier"
        },
        "customer": null,
        "batch": {
          "id": 1,
          "status": "closed"
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
            "qty": 2,
            "unit_price": 100,
            "discount_amount": 20,
            "subtotal": 180,
            "tax_amount": 73.8,
            "total": 253.8
          },
          {
            "id": 2,
            "product": {
              "id": 2,
              "title": "Lux Soap",
              "sku": "LUX-SOAP",
              "unit": "piece"
            },
            "qty": 1,
            "unit_price": 100,
            "discount_amount": 0,
            "subtotal": 100,
            "tax_amount": 46,
            "total": 146
          }
        ],
        "subtotal": 349.4,
        "is_order_discounted": false,
        "order_discount_type": null,
        "discount_amount": 0,
        "payment_method": "cash",
        "payment_status": "paid",
        "payment_gst_amount": 63.97,
        "fbr_invoice_enabled": false,
        "fbr_tax_amount": 0,
        "order_status": "completed",
        "total_amount": 463.77,
        "amount_paid": 1000,
        "change_due": 536.23,
        "cancel_reason": null,
        "cancelled_by": null,
        "placed_at": "2026-10-25T15:36:56.000Z",
        "channel": "pos",
        "is_pos_visible": true,
        "is_web_visible": false
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
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
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
              "tax": 781.86
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
              "tax": 56.53
            }
          ],
          "amount": 1230,
          "tax": 838.39,
          "total": 2068.39,
          "refunded_at": "2026-10-25T15:36:56.000Z"
        },
        {
          "id": 1,
          "refund_type": "complete",
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
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
          "refunded_at": "2026-10-25T15:36:56.000Z"
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
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "order": {
            "id": 1,
            "status": "completed"
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
              "tax": 69.36
            }
          ],
          "amount": 100,
          "tax": 69.36,
          "total": 169.36,
          "refunded_at": "2026-10-25T15:36:56.000Z"
        },
        {
          "id": 5,
          "refund_type": "partial",
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "order": {
            "id": 1,
            "status": "completed"
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
          "refunded_at": "2026-10-25T15:36:56.000Z"
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
          "created_at": "2026-10-25T15:36:56.000Z"
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
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
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
          "created_at": "2026-10-25T15:36:56.000Z"
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
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "order": {
            "id": 1,
            "status": "completed"
          },
          "movement_type": "refund",
          "reason": "refund",
          "reason_note": null,
          "qty": 1,
          "qty_after": 22,
          "unit_sold": 2,
          "created_at": "2026-10-25T15:36:56.000Z"
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
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "order": {
            "id": 1,
            "status": "completed"
          },
          "movement_type": "refund",
          "reason": "refund",
          "reason_note": null,
          "qty": 1,
          "qty_after": 44,
          "unit_sold": 4,
          "created_at": "2026-10-25T15:36:56.000Z"
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
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
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
          "created_at": "2026-10-25T15:36:56.000Z"
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
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
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
          "created_at": "2026-10-25T15:36:56.000Z"
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
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
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
          "created_at": "2026-10-25T15:36:56.000Z"
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
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
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
          "created_at": "2026-10-25T15:36:56.000Z"
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
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
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
          "created_at": "2026-10-25T15:36:56.000Z"
        },
        {
          "id": 6,
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
          "order": {
            "id": 3,
            "status": "refunded"
          },
          "movement_type": "sale",
          "reason": "sale",
          "reason_note": null,
          "qty": -12,
          "qty_after": 11,
          "unit_sold": 13,
          "created_at": "2026-10-25T15:36:56.000Z"
        },
        {
          "id": 5,
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
          "order": {
            "id": 1,
            "status": "completed"
          },
          "movement_type": "sale",
          "reason": "sale",
          "reason_note": null,
          "qty": -1,
          "qty_after": 23,
          "unit_sold": 1,
          "created_at": "2026-10-25T15:36:56.000Z"
        },
        {
          "id": 4,
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
          "order": {
            "id": 1,
            "status": "completed"
          },
          "movement_type": "sale",
          "reason": "sale",
          "reason_note": null,
          "qty": -2,
          "qty_after": 46,
          "unit_sold": 2,
          "created_at": "2026-10-25T15:36:56.000Z"
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
            "id": 1,
            "name": "Zayan Ahmed",
            "role": "store_admin"
          },
          "order": null,
          "movement_type": "stock_out",
          "reason": "damage",
          "reason_note": null,
          "qty": -2,
          "qty_after": 48,
          "unit_sold": 0,
          "created_at": "2026-10-25T15:36:55.000Z"
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
            "id": 1,
            "name": "Zayan Ahmed",
            "role": "store_admin"
          },
          "order": null,
          "movement_type": "stock_in",
          "reason": "opening_balance",
          "reason_note": null,
          "qty": 24,
          "qty_after": 24,
          "unit_sold": 0,
          "created_at": "2026-10-25T15:36:55.000Z"
        },
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
            "id": 1,
            "name": "Zayan Ahmed",
            "role": "store_admin"
          },
          "order": null,
          "movement_type": "stock_in",
          "reason": "purchase",
          "reason_note": null,
          "qty": 50,
          "qty_after": 50,
          "unit_sold": 0,
          "created_at": "2026-10-25T15:36:55.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 15,
        "total_pages": 1
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
          "qty": 20,
          "status": "on_the_way",
          "note": "Weekly refill",
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "created_at": "2026-10-25T15:36:55.000Z"
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
          "status": "on_the_way",
          "note": null,
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "created_at": "2026-10-25T15:36:55.000Z"
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
          "status": "on_the_way",
          "note": "Weekend stock",
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "created_at": "2026-10-25T15:36:55.000Z"
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
            },
            {
              "id": 2,
              "name": "Branch 2"
            }
          ],
          "is_active": true,
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
          "phone": "03006666666",
          "payment_terms": "Net 15",
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
            },
            {
              "id": 2,
              "name": "Branch 2"
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
            "orders": 3,
            "units_sold": 9,
            "gross_sales": 910,
            "line_discounts": 110,
            "order_discounts": 0,
            "discounts": 110,
            "net_sales": 800,
            "taxes": {
              "sales_tax": 144,
              "product_tax": 88.2,
              "category_tax": 34.5,
              "payment_method_tax": {
                "cash": 149.84,
                "card": 0,
                "jazzcash": 2.17,
                "easypaisa": 4.34,
                "total": 156.35
              },
              "total": 423.05
            },
            "shipping": 0,
            "total_sales": 1223.05,
            "total_collected": 3909.14,
            "refunds": 2686.09,
            "refunded_tax": 1046.09,
            "refunded_orders": 2,
            "refunded_items": 18,
            "voided_orders": 1,
            "cancelled_orders": 0,
            "cost": 350,
            "tax": 423.05,
            "revenue": 800,
            "tax_collection": {
              "product_tax": 88.2,
              "category_tax": 34.5,
              "default_store_tax": 144,
              "payment_gst": 156.35,
              "payment_gst_cash": 149.84,
              "payment_gst_card": 0,
              "payment_gst_jazzcash": 2.17,
              "payment_gst_easypaisa": 4.34,
              "total": 423.05
            },
            "gross_profit": 450,
            "avg_order_value": 407.68,
            "payments_net": 1223.05
          },
          "trend": [
            {
              "bucket": "2026-10-25",
              "sales": 1223.05,
              "orders": 3
            }
          ],
          "payments": [
            {
              "method": "CASH",
              "transactions": 5,
              "gross_amount": 3659.14,
              "tax": 507.81,
              "refunds": 2586.09,
              "net_amount": 1073.05,
              "percent": 88
            },
            {
              "method": "EASYPAISA",
              "transactions": 1,
              "gross_amount": 100,
              "tax": 4.34,
              "refunds": 0,
              "net_amount": 100,
              "percent": 8
            },
            {
              "method": "JAZZCASH",
              "transactions": 1,
              "gross_amount": 50,
              "tax": 2.17,
              "refunds": 0,
              "net_amount": 50,
              "percent": 4
            },
            {
              "method": "CARD",
              "transactions": 1,
              "gross_amount": 100,
              "tax": 4.32,
              "refunds": 100,
              "net_amount": 0,
              "percent": 0
            }
          ]
        },
        "by_product": {
          "rows": [
            {
              "id": 1,
              "product": "1 Litre Pepsi",
              "category": "Beverages",
              "units_sold": 4,
              "gross_sales": 400,
              "discounts": 110,
              "net_sales": 290,
              "sales_tax": 52.2,
              "product_tax": 52.2,
              "category_tax": 14.5,
              "tax": 118.9,
              "total_sales": 408.9,
              "percent": 38
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
              "percent": 27
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
              "percent": 18
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
              "percent": 17
            }
          ]
        },
        "by_category": {
          "rows": [
            {
              "category": "Beverages",
              "units_sold": 4,
              "gross_sales": 400,
              "discounts": 110,
              "net_sales": 290,
              "sales_tax": 52.2,
              "product_tax": 52.2,
              "category_tax": 14.5,
              "tax": 118.9,
              "total_sales": 408.9,
              "percent": 38
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
              "percent": 27
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
              "percent": 18
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
              "percent": 17
            }
          ]
        },
        "payments": {
          "rows": [
            {
              "method": "CASH",
              "transactions": 5,
              "gross_amount": 3659.14,
              "tax": 507.81,
              "refunds": 2586.09,
              "net_amount": 1073.05,
              "percent": 88
            },
            {
              "method": "EASYPAISA",
              "transactions": 1,
              "gross_amount": 100,
              "tax": 4.34,
              "refunds": 0,
              "net_amount": 100,
              "percent": 8
            },
            {
              "method": "JAZZCASH",
              "transactions": 1,
              "gross_amount": 50,
              "tax": 2.17,
              "refunds": 0,
              "net_amount": 50,
              "percent": 4
            },
            {
              "method": "CARD",
              "transactions": 1,
              "gross_amount": 100,
              "tax": 4.32,
              "refunds": 100,
              "net_amount": 0,
              "percent": 0
            }
          ],
          "totals": {
            "transactions": 8,
            "gross_amount": 3909.14,
            "tax": 518.64,
            "refunds": 2686.09,
            "net_amount": 1223.05
          }
        },
        "z_reports": {
          "rows": [
            {
              "id": 1,
              "session_id": 1,
              "date_time": "2026-10-25T15:36:55.000Z",
              "closed_at": "2026-10-25T15:36:56.000Z",
              "status": "CLOSED",
              "cashier": "Ameer Hamza",
              "opening_amount": 5000,
              "orders": 5,
              "gross_sales": 910,
              "discounts": 110,
              "net_sales": 800,
              "tax": 423.05,
              "refunds": 2686.09,
              "total_sales": 1223.05,
              "cash_sales": 1073.05,
              "card_sales": 0,
              "jazzcash_sales": 50,
              "easypaisa_sales": 100,
              "cash_in": 0,
              "cash_out": 0,
              "expected_cash": 6073.05,
              "counted_cash": 10000,
              "variance": 3926.95,
              "sales": 1223.05
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
              "stock_out": 15,
              "current_stock": 22
            },
            {
              "id": 1,
              "product": "1 Litre Pepsi",
              "sku": "1-LITRE-PEPSI",
              "category": "Beverages",
              "stock_in": 53,
              "stock_out": 9,
              "current_stock": 44
            }
          ]
        },
        "stock_movement": {
          "rows": [
            {
              "id": 4,
              "date": "2026-10-25T15:36:56.000Z",
              "product": "1 Litre Pepsi",
              "type": "SALE",
              "qty": -2,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 5,
              "date": "2026-10-25T15:36:56.000Z",
              "product": "Lux Soap",
              "type": "SALE",
              "qty": -1,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 6,
              "date": "2026-10-25T15:36:56.000Z",
              "product": "Lux Soap",
              "type": "SALE",
              "qty": -12,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 7,
              "date": "2026-10-25T15:36:56.000Z",
              "product": "1 Litre Pepsi",
              "type": "SALE",
              "qty": -1,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 8,
              "date": "2026-10-25T15:36:56.000Z",
              "product": "1 Litre Pepsi",
              "type": "SALE",
              "qty": -3,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 9,
              "date": "2026-10-25T15:36:56.000Z",
              "product": "Lux Soap",
              "type": "SALE",
              "qty": -2,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 10,
              "date": "2026-10-25T15:36:56.000Z",
              "product": "Lux Soap",
              "type": "REFUND",
              "qty": 12,
              "reason": "Refund",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 11,
              "date": "2026-10-25T15:36:56.000Z",
              "product": "1 Litre Pepsi",
              "type": "REFUND",
              "qty": 1,
              "reason": "Refund",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 12,
              "date": "2026-10-25T15:36:56.000Z",
              "product": "1 Litre Pepsi",
              "type": "REFUND",
              "qty": 1,
              "reason": "Refund",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 13,
              "date": "2026-10-25T15:36:56.000Z",
              "product": "Lux Soap",
              "type": "REFUND",
              "qty": 1,
              "reason": "Refund",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 14,
              "date": "2026-10-25T15:36:56.000Z",
              "product": "1 Litre Pepsi",
              "type": "SALE",
              "qty": -1,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 15,
              "date": "2026-10-25T15:36:56.000Z",
              "product": "1 Litre Pepsi",
              "type": "REFUND",
              "qty": 1,
              "reason": "Refund",
              "channel": "both",
              "cashier": "Zayan Ahmed"
            },
            {
              "id": 1,
              "date": "2026-10-25T15:36:55.000Z",
              "product": "1 Litre Pepsi",
              "type": "STOCK_IN",
              "qty": 50,
              "reason": "Purchase",
              "channel": "both",
              "cashier": "Zayan Ahmed"
            },
            {
              "id": 2,
              "date": "2026-10-25T15:36:55.000Z",
              "product": "Lux Soap",
              "type": "STOCK_IN",
              "qty": 24,
              "reason": "Opening Balance",
              "channel": "both",
              "cashier": "Zayan Ahmed"
            },
            {
              "id": 3,
              "date": "2026-10-25T15:36:55.000Z",
              "product": "1 Litre Pepsi",
              "type": "STOCK_OUT",
              "qty": -2,
              "reason": "Damage",
              "channel": "both",
              "cashier": "Zayan Ahmed"
            }
          ]
        },
        "refund_void": {
          "rows": [
            {
              "id": 5,
              "type": "refund",
              "date": "2026-10-25T15:36:56.000Z",
              "order_number": 1,
              "channel": "pos",
              "amount": 147.2,
              "reason": "Customer return",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 6,
              "type": "refund",
              "date": "2026-10-25T15:36:56.000Z",
              "order_number": 1,
              "channel": "pos",
              "amount": 169.36,
              "reason": "Damaged item",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 3,
              "type": "refund",
              "date": "2026-10-25T15:36:56.000Z",
              "order_number": 3,
              "channel": "pos",
              "amount": 1921.86,
              "reason": "Customer changed mind",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 4,
              "type": "refund",
              "date": "2026-10-25T15:36:56.000Z",
              "order_number": 3,
              "channel": "pos",
              "amount": 146.53,
              "reason": "Customer changed mind",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 1,
              "type": "refund",
              "date": "2026-10-25T15:36:56.000Z",
              "order_number": 2,
              "channel": "pos",
              "amount": 136.88,
              "reason": "Full return",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 2,
              "type": "refund",
              "date": "2026-10-25T15:36:56.000Z",
              "order_number": 2,
              "channel": "pos",
              "amount": 164.26,
              "reason": "Full return",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 6,
              "type": "void",
              "date": "2026-10-25T15:36:56.000Z",
              "order_number": 6,
              "channel": "pos",
              "amount": 147.2,
              "reason": "Customer left",
              "cashier": "Ameer Hamza"
            }
          ],
          "totals": {
            "refunds": 6,
            "voids": 1,
            "cancelled": 0,
            "amount": 2833.29
          }
        },
        "refunded_orders": {
          "rows": [
            {
              "id": 5,
              "order_number": 1,
              "refund_type": "partial",
              "date": "2026-10-25T15:36:56.000Z",
              "amount": 90,
              "tax": 57.2,
              "total": 147.2,
              "reason": "Customer return",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 6,
              "order_number": 1,
              "refund_type": "partial",
              "date": "2026-10-25T15:36:56.000Z",
              "amount": 100,
              "tax": 69.36,
              "total": 169.36,
              "reason": "Damaged item",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 3,
              "order_number": 3,
              "refund_type": "complete",
              "date": "2026-10-25T15:36:56.000Z",
              "amount": 1140,
              "tax": 781.86,
              "total": 1921.86,
              "reason": "Customer changed mind",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 4,
              "order_number": 3,
              "refund_type": "complete",
              "date": "2026-10-25T15:36:56.000Z",
              "amount": 90,
              "tax": 56.53,
              "total": 146.53,
              "reason": "Customer changed mind",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 1,
              "order_number": 2,
              "refund_type": "complete",
              "date": "2026-10-25T15:36:56.000Z",
              "amount": 100,
              "tax": 36.88,
              "total": 136.88,
              "reason": "Full return",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 2,
              "order_number": 2,
              "refund_type": "complete",
              "date": "2026-10-25T15:36:56.000Z",
              "amount": 120,
              "tax": 44.26,
              "total": 164.26,
              "reason": "Full return",
              "cashier": "Ameer Hamza"
            }
          ],
          "totals": {
            "refunds": 6,
            "complete": 4,
            "partial": 2,
            "orders": 3,
            "amount": 1640,
            "tax": 1046.09,
            "total": 2686.09
          }
        },
        "cancelled_orders": {
          "rows": [
            {
              "id": 6,
              "status": "voided",
              "date": "2026-10-25T15:36:56.000Z",
              "amount": 147.2,
              "reason": "Customer left",
              "cashier": "Ameer Hamza"
            }
          ],
          "totals": {
            "orders": 1,
            "voided": 1,
            "cancelled": 0,
            "amount": 147.2
          }
        },
        "by_cashier": {
          "rows": [
            {
              "id": 3,
              "cashier": "Ameer Hamza",
              "orders": 5,
              "total_sales": 3909.14,
              "discounts": 190,
              "tax": 1469.14,
              "refunds": 2686.09,
              "net_sales": 1223.05
            }
          ]
        },
        "tax_breakdown": {
          "totals": {
            "orders": 3,
            "net_sales": 800,
            "tax_collected": 423.05,
            "total_sales": 1223.05,
            "taxes": {
              "sales_tax": 144,
              "product_tax": 88.2,
              "category_tax": 34.5,
              "payment_method_tax": {
                "cash": 149.84,
                "card": 0,
                "jazzcash": 2.17,
                "easypaisa": 4.34,
                "total": 156.35
              },
              "total": 423.05
            },
            "tax_collection": {
              "product_tax": 88.2,
              "category_tax": 34.5,
              "default_store_tax": 144,
              "payment_gst": 156.35,
              "payment_gst_cash": 149.84,
              "payment_gst_card": 0,
              "payment_gst_jazzcash": 2.17,
              "payment_gst_easypaisa": 4.34,
              "total": 423.05
            },
            "fbr_reported": 0
          },
          "rows": [
            {
              "id": "sales_tax",
              "tax_rule": "Sales Tax",
              "tax_collected": 144
            },
            {
              "id": "product_tax",
              "tax_rule": "Product Level Tax",
              "tax_collected": 88.2
            },
            {
              "id": "category_tax",
              "tax_rule": "Category Level Tax",
              "tax_collected": 34.5
            },
            {
              "id": "payment_tax_cash",
              "tax_rule": "Payment Method Tax (Cash)",
              "tax_collected": 149.84
            },
            {
              "id": "payment_tax_card",
              "tax_rule": "Payment Method Tax (Card)",
              "tax_collected": 0
            },
            {
              "id": "payment_tax_jazzcash",
              "tax_rule": "Payment Method Tax (JazzCash)",
              "tax_collected": 2.17
            },
            {
              "id": "payment_tax_easypaisa",
              "tax_rule": "Payment Method Tax (EasyPaisa)",
              "tax_collected": 4.34
            },
            {
              "id": "payment_tax",
              "tax_rule": "Payment Method Tax (total)",
              "tax_collected": 156.35
            },
            {
              "id": "total",
              "tax_rule": "Total Tax",
              "tax_collected": 423.05
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
              "orders": 3,
              "gross_sales": 910,
              "discounts": 110,
              "net_sales": 800,
              "tax": 423.05,
              "refunds": 2686.09,
              "total_sales": 1223.05,
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
            "orders": 3,
            "units_sold": 9,
            "gross_sales": 910,
            "line_discounts": 110,
            "order_discounts": 0,
            "discounts": 110,
            "net_sales": 800,
            "taxes": {
              "sales_tax": 144,
              "product_tax": 88.2,
              "category_tax": 34.5,
              "payment_method_tax": {
                "cash": 149.84,
                "card": 0,
                "jazzcash": 2.17,
                "easypaisa": 4.34,
                "total": 156.35
              },
              "total": 423.05
            },
            "shipping": 0,
            "total_sales": 1223.05,
            "total_collected": 3909.14,
            "refunds": 2686.09,
            "refunded_tax": 1046.09,
            "refunded_orders": 2,
            "refunded_items": 18,
            "voided_orders": 1,
            "cancelled_orders": 0,
            "cost": 350,
            "tax": 423.05,
            "revenue": 800,
            "tax_collection": {
              "product_tax": 88.2,
              "category_tax": 34.5,
              "default_store_tax": 144,
              "payment_gst": 156.35,
              "payment_gst_cash": 149.84,
              "payment_gst_card": 0,
              "payment_gst_jazzcash": 2.17,
              "payment_gst_easypaisa": 4.34,
              "total": 423.05
            },
            "gross_profit": 450,
            "avg_order_value": 407.68,
            "payments_net": 1223.05
          },
          "trend": [
            {
              "bucket": "2026-10-25",
              "sales": 1223.05,
              "orders": 3
            }
          ],
          "payments": [
            {
              "method": "CASH",
              "transactions": 5,
              "gross_amount": 3659.14,
              "tax": 507.81,
              "refunds": 2586.09,
              "net_amount": 1073.05,
              "percent": 88
            },
            {
              "method": "EASYPAISA",
              "transactions": 1,
              "gross_amount": 100,
              "tax": 4.34,
              "refunds": 0,
              "net_amount": 100,
              "percent": 8
            },
            {
              "method": "JAZZCASH",
              "transactions": 1,
              "gross_amount": 50,
              "tax": 2.17,
              "refunds": 0,
              "net_amount": 50,
              "percent": 4
            },
            {
              "method": "CARD",
              "transactions": 1,
              "gross_amount": 100,
              "tax": 4.32,
              "refunds": 100,
              "net_amount": 0,
              "percent": 0
            }
          ]
        },
        "by_product": {
          "rows": [
            {
              "id": 1,
              "product": "1 Litre Pepsi",
              "category": "Beverages",
              "units_sold": 4,
              "gross_sales": 400,
              "discounts": 110,
              "net_sales": 290,
              "sales_tax": 52.2,
              "product_tax": 52.2,
              "category_tax": 14.5,
              "tax": 118.9,
              "total_sales": 408.9,
              "percent": 38
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
              "percent": 27
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
              "percent": 18
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
              "percent": 17
            }
          ]
        },
        "by_category": {
          "rows": [
            {
              "category": "Beverages",
              "units_sold": 4,
              "gross_sales": 400,
              "discounts": 110,
              "net_sales": 290,
              "sales_tax": 52.2,
              "product_tax": 52.2,
              "category_tax": 14.5,
              "tax": 118.9,
              "total_sales": 408.9,
              "percent": 38
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
              "percent": 27
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
              "percent": 18
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
              "percent": 17
            }
          ]
        },
        "payments": {
          "rows": [
            {
              "method": "CASH",
              "transactions": 5,
              "gross_amount": 3659.14,
              "tax": 507.81,
              "refunds": 2586.09,
              "net_amount": 1073.05,
              "percent": 88
            },
            {
              "method": "EASYPAISA",
              "transactions": 1,
              "gross_amount": 100,
              "tax": 4.34,
              "refunds": 0,
              "net_amount": 100,
              "percent": 8
            },
            {
              "method": "JAZZCASH",
              "transactions": 1,
              "gross_amount": 50,
              "tax": 2.17,
              "refunds": 0,
              "net_amount": 50,
              "percent": 4
            },
            {
              "method": "CARD",
              "transactions": 1,
              "gross_amount": 100,
              "tax": 4.32,
              "refunds": 100,
              "net_amount": 0,
              "percent": 0
            }
          ],
          "totals": {
            "transactions": 8,
            "gross_amount": 3909.14,
            "tax": 518.64,
            "refunds": 2686.09,
            "net_amount": 1223.05
          }
        },
        "z_reports": {
          "rows": [
            {
              "id": 1,
              "session_id": 1,
              "date_time": "2026-10-25T15:36:55.000Z",
              "closed_at": "2026-10-25T15:36:56.000Z",
              "status": "CLOSED",
              "cashier": "Ameer Hamza",
              "opening_amount": 5000,
              "orders": 5,
              "gross_sales": 910,
              "discounts": 110,
              "net_sales": 800,
              "tax": 423.05,
              "refunds": 2686.09,
              "total_sales": 1223.05,
              "cash_sales": 1073.05,
              "card_sales": 0,
              "jazzcash_sales": 50,
              "easypaisa_sales": 100,
              "cash_in": 0,
              "cash_out": 0,
              "expected_cash": 6073.05,
              "counted_cash": 10000,
              "variance": 3926.95,
              "sales": 1223.05
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
              "stock_out": 15,
              "current_stock": 22
            },
            {
              "id": 1,
              "product": "1 Litre Pepsi",
              "sku": "1-LITRE-PEPSI",
              "category": "Beverages",
              "stock_in": 53,
              "stock_out": 9,
              "current_stock": 44
            }
          ]
        },
        "stock_movement": {
          "rows": [
            {
              "id": 15,
              "date": "2026-10-25T15:36:56.000Z",
              "product": "1 Litre Pepsi",
              "type": "REFUND",
              "qty": 1,
              "reason": "Refund",
              "channel": "both",
              "cashier": "Zayan Ahmed"
            },
            {
              "id": 8,
              "date": "2026-10-25T15:36:56.000Z",
              "product": "1 Litre Pepsi",
              "type": "SALE",
              "qty": -3,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 13,
              "date": "2026-10-25T15:36:56.000Z",
              "product": "Lux Soap",
              "type": "REFUND",
              "qty": 1,
              "reason": "Refund",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 12,
              "date": "2026-10-25T15:36:56.000Z",
              "product": "1 Litre Pepsi",
              "type": "REFUND",
              "qty": 1,
              "reason": "Refund",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 10,
              "date": "2026-10-25T15:36:56.000Z",
              "product": "Lux Soap",
              "type": "REFUND",
              "qty": 12,
              "reason": "Refund",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 14,
              "date": "2026-10-25T15:36:56.000Z",
              "product": "1 Litre Pepsi",
              "type": "SALE",
              "qty": -1,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 6,
              "date": "2026-10-25T15:36:56.000Z",
              "product": "Lux Soap",
              "type": "SALE",
              "qty": -12,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 11,
              "date": "2026-10-25T15:36:56.000Z",
              "product": "1 Litre Pepsi",
              "type": "REFUND",
              "qty": 1,
              "reason": "Refund",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 7,
              "date": "2026-10-25T15:36:56.000Z",
              "product": "1 Litre Pepsi",
              "type": "SALE",
              "qty": -1,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 9,
              "date": "2026-10-25T15:36:56.000Z",
              "product": "Lux Soap",
              "type": "SALE",
              "qty": -2,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 4,
              "date": "2026-10-25T15:36:56.000Z",
              "product": "1 Litre Pepsi",
              "type": "SALE",
              "qty": -2,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 5,
              "date": "2026-10-25T15:36:56.000Z",
              "product": "Lux Soap",
              "type": "SALE",
              "qty": -1,
              "reason": "Sale",
              "channel": "both",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 1,
              "date": "2026-10-25T15:36:55.000Z",
              "product": "1 Litre Pepsi",
              "type": "STOCK_IN",
              "qty": 50,
              "reason": "Purchase",
              "channel": "both",
              "cashier": "Zayan Ahmed"
            },
            {
              "id": 2,
              "date": "2026-10-25T15:36:55.000Z",
              "product": "Lux Soap",
              "type": "STOCK_IN",
              "qty": 24,
              "reason": "Opening Balance",
              "channel": "both",
              "cashier": "Zayan Ahmed"
            },
            {
              "id": 3,
              "date": "2026-10-25T15:36:55.000Z",
              "product": "1 Litre Pepsi",
              "type": "STOCK_OUT",
              "qty": -2,
              "reason": "Damage",
              "channel": "both",
              "cashier": "Zayan Ahmed"
            }
          ]
        },
        "refund_void": {
          "rows": [
            {
              "id": 5,
              "type": "refund",
              "date": "2026-10-25T15:36:56.000Z",
              "order_number": 1,
              "channel": "pos",
              "amount": 147.2,
              "reason": "Customer return",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 6,
              "type": "refund",
              "date": "2026-10-25T15:36:56.000Z",
              "order_number": 1,
              "channel": "pos",
              "amount": 169.36,
              "reason": "Damaged item",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 3,
              "type": "refund",
              "date": "2026-10-25T15:36:56.000Z",
              "order_number": 3,
              "channel": "pos",
              "amount": 1921.86,
              "reason": "Customer changed mind",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 4,
              "type": "refund",
              "date": "2026-10-25T15:36:56.000Z",
              "order_number": 3,
              "channel": "pos",
              "amount": 146.53,
              "reason": "Customer changed mind",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 1,
              "type": "refund",
              "date": "2026-10-25T15:36:56.000Z",
              "order_number": 2,
              "channel": "pos",
              "amount": 136.88,
              "reason": "Full return",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 2,
              "type": "refund",
              "date": "2026-10-25T15:36:56.000Z",
              "order_number": 2,
              "channel": "pos",
              "amount": 164.26,
              "reason": "Full return",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 6,
              "type": "void",
              "date": "2026-10-25T15:36:56.000Z",
              "order_number": 6,
              "channel": "pos",
              "amount": 147.2,
              "reason": "Customer left",
              "cashier": "Ameer Hamza"
            }
          ],
          "totals": {
            "refunds": 6,
            "voids": 1,
            "cancelled": 0,
            "amount": 2833.29
          }
        },
        "refunded_orders": {
          "rows": [
            {
              "id": 5,
              "order_number": 1,
              "refund_type": "partial",
              "date": "2026-10-25T15:36:56.000Z",
              "amount": 90,
              "tax": 57.2,
              "total": 147.2,
              "reason": "Customer return",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 6,
              "order_number": 1,
              "refund_type": "partial",
              "date": "2026-10-25T15:36:56.000Z",
              "amount": 100,
              "tax": 69.36,
              "total": 169.36,
              "reason": "Damaged item",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 3,
              "order_number": 3,
              "refund_type": "complete",
              "date": "2026-10-25T15:36:56.000Z",
              "amount": 1140,
              "tax": 781.86,
              "total": 1921.86,
              "reason": "Customer changed mind",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 4,
              "order_number": 3,
              "refund_type": "complete",
              "date": "2026-10-25T15:36:56.000Z",
              "amount": 90,
              "tax": 56.53,
              "total": 146.53,
              "reason": "Customer changed mind",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 1,
              "order_number": 2,
              "refund_type": "complete",
              "date": "2026-10-25T15:36:56.000Z",
              "amount": 100,
              "tax": 36.88,
              "total": 136.88,
              "reason": "Full return",
              "cashier": "Ameer Hamza"
            },
            {
              "id": 2,
              "order_number": 2,
              "refund_type": "complete",
              "date": "2026-10-25T15:36:56.000Z",
              "amount": 120,
              "tax": 44.26,
              "total": 164.26,
              "reason": "Full return",
              "cashier": "Ameer Hamza"
            }
          ],
          "totals": {
            "refunds": 6,
            "complete": 4,
            "partial": 2,
            "orders": 3,
            "amount": 1640,
            "tax": 1046.09,
            "total": 2686.09
          }
        },
        "cancelled_orders": {
          "rows": [
            {
              "id": 6,
              "status": "voided",
              "date": "2026-10-25T15:36:56.000Z",
              "amount": 147.2,
              "reason": "Customer left",
              "cashier": "Ameer Hamza"
            }
          ],
          "totals": {
            "orders": 1,
            "voided": 1,
            "cancelled": 0,
            "amount": 147.2
          }
        },
        "by_cashier": {
          "rows": [
            {
              "id": 3,
              "cashier": "Ameer Hamza",
              "orders": 5,
              "total_sales": 3909.14,
              "discounts": 190,
              "tax": 1469.14,
              "refunds": 2686.09,
              "net_sales": 1223.05
            }
          ]
        },
        "tax_breakdown": {
          "totals": {
            "orders": 3,
            "net_sales": 800,
            "tax_collected": 423.05,
            "total_sales": 1223.05,
            "taxes": {
              "sales_tax": 144,
              "product_tax": 88.2,
              "category_tax": 34.5,
              "payment_method_tax": {
                "cash": 149.84,
                "card": 0,
                "jazzcash": 2.17,
                "easypaisa": 4.34,
                "total": 156.35
              },
              "total": 423.05
            },
            "tax_collection": {
              "product_tax": 88.2,
              "category_tax": 34.5,
              "default_store_tax": 144,
              "payment_gst": 156.35,
              "payment_gst_cash": 149.84,
              "payment_gst_card": 0,
              "payment_gst_jazzcash": 2.17,
              "payment_gst_easypaisa": 4.34,
              "total": 423.05
            },
            "fbr_reported": 0
          },
          "rows": [
            {
              "id": "sales_tax",
              "tax_rule": "Sales Tax",
              "tax_collected": 144
            },
            {
              "id": "product_tax",
              "tax_rule": "Product Level Tax",
              "tax_collected": 88.2
            },
            {
              "id": "category_tax",
              "tax_rule": "Category Level Tax",
              "tax_collected": 34.5
            },
            {
              "id": "payment_tax_cash",
              "tax_rule": "Payment Method Tax (Cash)",
              "tax_collected": 149.84
            },
            {
              "id": "payment_tax_card",
              "tax_rule": "Payment Method Tax (Card)",
              "tax_collected": 0
            },
            {
              "id": "payment_tax_jazzcash",
              "tax_rule": "Payment Method Tax (JazzCash)",
              "tax_collected": 2.17
            },
            {
              "id": "payment_tax_easypaisa",
              "tax_rule": "Payment Method Tax (EasyPaisa)",
              "tax_collected": 4.34
            },
            {
              "id": "payment_tax",
              "tax_rule": "Payment Method Tax (total)",
              "tax_collected": 156.35
            },
            {
              "id": "total",
              "tax_rule": "Total Tax",
              "tax_collected": 423.05
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
          "orders": 3,
          "sales_collected": 1223.05,
          "cost": 350,
          "discounts": 0,
          "refunds": 316.56,
          "tax_collection": {
            "product_tax": 88.2,
            "category_tax": 34.5,
            "default_store_tax": 144,
            "payment_gst": 156.34,
            "payment_gst_cash": 149.83,
            "payment_gst_card": 0,
            "payment_gst_jazzcash": 2.17,
            "payment_gst_easypaisa": 4.34,
            "fbr": 0,
            "total": 423.04
          },
          "tax": 423.04,
          "gross_profit": 450
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
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "status": "closed",
          "opening_amount": 5000,
          "opening_at": "2026-10-25T15:36:55.000Z",
          "cash_sales": 973.05,
          "card_sales": 100,
          "jazzcash_sales": 50,
          "easypaisa_sales": 100,
          "total_sales": 1223.05,
          "expected_cash": 5973.05,
          "total_cash": 10000,
          "cash_variance": 4026.95,
          "closing_at": "2026-10-25T15:36:56.000Z"
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
          "id": 6,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "is_custom": false,
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "customer": null,
          "batch": {
            "id": 1,
            "status": "closed"
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
              "qty": 1,
              "unit_price": 100,
              "discount_amount": 10,
              "subtotal": 90,
              "tax_amount": 36.9,
              "total": 126.9
            }
          ],
          "subtotal": 110.7,
          "is_order_discounted": false,
          "order_discount_type": null,
          "discount_amount": 0,
          "payment_method": "cash",
          "payment_status": "refunded",
          "payment_gst_amount": 20.3,
          "fbr_invoice_enabled": false,
          "fbr_tax_amount": 0,
          "order_status": "voided",
          "total_amount": 147.2,
          "amount_paid": 500,
          "change_due": 352.8,
          "cancel_reason": "Customer left",
          "cancelled_by": null,
          "placed_at": "2026-10-25T15:36:56.000Z",
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
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "customer": null,
          "batch": {
            "id": 1,
            "status": "closed"
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
              "qty": 3,
              "unit_price": 100,
              "discount_amount": 100,
              "subtotal": 200,
              "tax_amount": 82,
              "total": 282
            },
            {
              "id": 2,
              "product": {
                "id": 2,
                "title": "Lux Soap",
                "sku": "LUX-SOAP",
                "unit": "piece"
              },
              "qty": 2,
              "unit_price": 100,
              "discount_amount": 0,
              "subtotal": 200,
              "tax_amount": 92,
              "total": 292
            }
          ],
          "subtotal": 502,
          "is_order_discounted": false,
          "order_discount_type": null,
          "discount_amount": 0,
          "payment_method": "mixed",
          "payment_status": "paid",
          "payment_gst_amount": 82.3,
          "fbr_invoice_enabled": false,
          "fbr_tax_amount": 0,
          "order_status": "completed",
          "total_amount": 656.3,
          "amount_paid": 1600,
          "change_due": 943.7,
          "cancel_reason": null,
          "cancelled_by": null,
          "placed_at": "2026-10-25T15:36:56.000Z",
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
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "customer": null,
          "batch": {
            "id": 1,
            "status": "closed"
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
          "payment_gst_amount": 53.74,
          "fbr_invoice_enabled": false,
          "fbr_tax_amount": 0,
          "order_status": "completed",
          "total_amount": 419.54,
          "amount_paid": 550,
          "change_due": 130.46,
          "cancel_reason": null,
          "cancelled_by": null,
          "placed_at": "2026-10-25T15:36:56.000Z",
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
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "customer": null,
          "batch": {
            "id": 1,
            "status": "closed"
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
              "qty": 12,
              "unit_price": 100,
              "discount_amount": 60,
              "subtotal": 1140,
              "tax_amount": 524.4,
              "total": 1664.4
            },
            {
              "id": 2,
              "product": {
                "id": 1,
                "title": "1 Litre Pepsi",
                "sku": "1-LITRE-PEPSI",
                "unit": "bottle"
              },
              "qty": 1,
              "unit_price": 100,
              "discount_amount": 10,
              "subtotal": 90,
              "tax_amount": 36.9,
              "total": 126.9
            }
          ],
          "subtotal": 1569.9,
          "is_order_discounted": false,
          "order_discount_type": null,
          "discount_amount": 0,
          "payment_method": "mixed",
          "payment_status": "refunded",
          "payment_gst_amount": 277.09,
          "fbr_invoice_enabled": false,
          "fbr_tax_amount": 0,
          "order_status": "refunded",
          "total_amount": 2068.39,
          "amount_paid": 3100,
          "change_due": 1031.61,
          "cancel_reason": null,
          "cancelled_by": null,
          "placed_at": "2026-10-25T15:36:56.000Z",
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
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "customer": null,
          "batch": {
            "id": 1,
            "status": "closed"
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
          "payment_status": "refunded",
          "payment_gst_amount": 41.54,
          "fbr_invoice_enabled": false,
          "fbr_tax_amount": 0,
          "order_status": "refunded",
          "total_amount": 301.14,
          "amount_paid": 500,
          "change_due": 198.86,
          "cancel_reason": null,
          "cancelled_by": null,
          "placed_at": "2026-10-25T15:36:56.000Z",
          "channel": "pos",
          "is_pos_visible": true,
          "is_web_visible": false
        },
        {
          "id": 1,
          "location": {
            "id": 1,
            "name": "Gulshan e Iqbal Block 13 D"
          },
          "is_custom": false,
          "staff": {
            "id": 3,
            "name": "Ameer Hamza",
            "role": "cashier"
          },
          "customer": null,
          "batch": {
            "id": 1,
            "status": "closed"
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
              "qty": 2,
              "unit_price": 100,
              "discount_amount": 20,
              "subtotal": 180,
              "tax_amount": 73.8,
              "total": 253.8
            },
            {
              "id": 2,
              "product": {
                "id": 2,
                "title": "Lux Soap",
                "sku": "LUX-SOAP",
                "unit": "piece"
              },
              "qty": 1,
              "unit_price": 100,
              "discount_amount": 0,
              "subtotal": 100,
              "tax_amount": 46,
              "total": 146
            }
          ],
          "subtotal": 349.4,
          "is_order_discounted": false,
          "order_discount_type": null,
          "discount_amount": 0,
          "payment_method": "cash",
          "payment_status": "paid",
          "payment_gst_amount": 63.97,
          "fbr_invoice_enabled": false,
          "fbr_tax_amount": 0,
          "order_status": "completed",
          "total_amount": 463.77,
          "amount_paid": 1000,
          "change_due": 536.23,
          "cancel_reason": null,
          "cancelled_by": null,
          "placed_at": "2026-10-25T15:36:56.000Z",
          "channel": "pos",
          "is_pos_visible": true,
          "is_web_visible": false
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 6,
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
          "phone": null,
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
          "pin": "4444",
          "role": "cashier",
          "phone": null,
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
          "paid_at": "2026-10-25T15:36:56.000Z"
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
          "amount": 556.3,
          "tax_amount": 77.96,
          "currency": "PKR",
          "status": "success",
          "paid_at": "2026-10-25T15:36:56.000Z"
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
          "amount": 100,
          "tax_amount": 4.34,
          "currency": "PKR",
          "status": "success",
          "paid_at": "2026-10-25T15:36:56.000Z"
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
          "amount": 369.54,
          "tax_amount": 51.57,
          "currency": "PKR",
          "status": "success",
          "paid_at": "2026-10-25T15:36:56.000Z"
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
          "tax_amount": 2.17,
          "currency": "PKR",
          "status": "success",
          "paid_at": "2026-10-25T15:36:56.000Z"
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
          "amount": 1968.39,
          "tax_amount": 272.77,
          "currency": "PKR",
          "status": "success",
          "paid_at": "2026-10-25T15:36:56.000Z"
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
          "tax_amount": 4.32,
          "currency": "PKR",
          "status": "success",
          "paid_at": "2026-10-25T15:36:56.000Z"
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
          "paid_at": "2026-10-25T15:36:56.000Z"
        },
        {
          "id": 1,
          "reference": null,
          "order": {
            "id": 1,
            "status": "completed"
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
          "paid_at": "2026-10-25T15:36:56.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 9,
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
        "location": {
          "id": 1,
          "name": "Gulshan e Iqbal Block 13 D"
        },
        "staff": {
          "id": 3,
          "name": "Ameer Hamza",
          "role": "cashier"
        },
        "order": {
          "id": 1,
          "status": "completed"
        },
        "transaction": {
          "id": 1,
          "method": "cash"
        },
        "subTotal": 280,
        "discount_amount": 0,
        "tax_breakdown": {
          "payment_gst": "16%",
          "fbr_fee": 0
        },
        "tax_amount": 183.77,
        "total": 463.77,
        "issued_at": "2026-10-25T15:36:56.000Z",
        "currency": "PKR"
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
        "location": {
          "id": 1,
          "name": "Gulshan e Iqbal Block 13 D"
        },
        "staff": {
          "id": 3,
          "name": "Ameer Hamza",
          "role": "cashier"
        },
        "order": {
          "id": 2,
          "status": "refunded"
        },
        "refundId": 1,
        "refund_type": "complete",
        "currency": "PKR",
        "reason": "Full return",
        "subTotal": 100,
        "tax_amount": 36.88,
        "total": 136.88,
        "issued_at": "2026-10-25T15:36:56.000Z"
      }
    }
  }],
}
