frappe.ui.form.on('Sales Invoice', {
    refresh: function (frm) {
        if (frm.doc.__islocal){
            frm.set_value('custom_current_employee_user_id',frappe.user.name)
            frm.set_value('custom_current_employee_user_id_',frappe.user.name)
        }
        hide_unneccassry_thing(frm)
        set_grand_total(frm)
    },
    customer: function (frm) {
        let tab_name = 'sales-invoice-contact_and_address_tab-tab'
        $(`a[id="${tab_name}"]`).hide()
        set_value(frm)
        address_set(frm)
    },
    custom_store: function (frm) {
        if (frm.is_new()) {
            frm.set_value('set_warehouse', frm.doc.custom_store)
            frm.set_df_property('set_warehouse', 'hidden', 1)
            // frm.set_value('taxes_and_charges','Output GST In-state')
        }
    }
});
frappe.ui.form.on('Sales Invoice Item', {
    item_code: function (frm, cdt, cdn) {
        set_warehouse_in_items(frm)
        set_grand_total(frm)
    }
})

// All fucntions
function set_grand_total(frm) {
    if (frm.doc.custom_minimum_service_charges && !frm.is_new()) {
        setTimeout(() => {
            let total_inr = frm.doc.total;
            let min_service_charge = frm.doc.custom_minimum_service_charges;
            let grand_total = frm.doc.grand_total;
            let total = total_inr + min_service_charge;
            if (total !== grand_total) {
                frm.set_value('grand_total', total);
            }
        }, 200);
    }

}
function hide_unneccassry_thing(frm) {
    let user = frappe.user.name;
    if (user != 'anwar@standardtouch.com' && user != 'nasir@standardtouch.com' && user != 'zaid@standardtouch.com') {
        const fieldsToHide = [
            'set_posting_time', 'is_pos', 'is_consolidated', 'is_return', 'is_debit_note', 'accounting_dimensions_section',
            'currency_and_price_list', 'time_sheet_list', 'shipping_rule', 'tax_category', 'incoterm',
            'base_rounding_adjustment', 'rounding_adjustment', 'use_company_roundoff_cost_center', 'base_rounded_total',
            'rounded_total', 'disable_rounded_total', 'total_advance', 'outstanding_amount', 'is_cash_or_non_trade_discount',
            'totals', 'scan_barcode', 'update_stock', 'set_target_warehouse','e_waybill_status'
        ];
        fieldsToHide.forEach(fieldname => {
            frm.set_df_property(fieldname, 'hidden', 1);
        });
        const tab_break_to_hide = ['sales-invoice-payments_tab-tab', 'sales-invoice-contact_and_address_tab-tab',
            'sales-invoice-terms_tab-tab']
        tab_break_to_hide.forEach(tab_name => {
            $(`a[id="${tab_name}"]`).hide()
        });
        const button_to_hide = ['Payment Request', 'Subscription', 'Invoice Discounting', 'Maintenance Schedule', 'Maintenance Schedule']
        var buttons_formatted = button_to_hide.map(function (button_name) {
            return button_name.replace(/\s/g, '%20');
        });
        setTimeout(function () {
            // View Button Hide
            $('div.inner-group-button[data-label="View"]').remove()
            $('div.inner-group-button[data-label="e-Waybill"]').remove()
            buttons_formatted.forEach(button => {
                $(frm.wrapper).find(`a.dropdown-item[data-label = "${button}"]`).remove()
                console.log(`a.dropdown-item[data-label = "${button}"]`);
            })
        }, 200);
    }
}
function set_value(frm) {
    if (frm.doc.customer) {
        // hide_customer_name(frm)
        let field_value_from_customer = [
            'custom_first_name', 'gender', 'custom_mobile_number', 'custom_taluka', 'custom_location', 'custom_member_group', 'custom_full_address',
            'custom_last_name', 'custom_date_of_birth', 'custom_alteranate_mobile_number', 'custom_district_', 'custom_pin_code', 'custom_particular', 'custom_full_address'
        ];
        let sales_invoice_field_name = [
            'custom_first_name', 'custom_gender', 'custom_mobile_number', 'custom_taluka', 'custom_location', 'custom_member_group', 'custom_full_address',
            'custom_last_name', 'custom_date_of_birth', 'custom_alternate_mobile_number', 'custom_district', 'custom_pin_code', 'custom_particular', 'custom_delivery_address',

        ];
        field_value_from_customer.forEach((field_value, index) => {
            frappe.db.get_value('Customer', frm.doc.customer, field_value)
                .then(r => {
                    if (r.message) {
                        let result_object = r.message;
                        let first_key = Object.keys(result_object)[0];
                        let first_value = result_object[first_key];
                        frm.set_value(sales_invoice_field_name[index], first_value);
                        console.log(sales_invoice_field_name[index], first_value);
                    }
                });
        });
    }
}
function address_set(frm) {
    frappe.db.get_value('Customer', frm.doc.customer, 'primary_address')
        .then(response => {
            // The response object contains the data
            let full_address = response.message.primary_address;

            // Split the full_address string into an array based on '<br>'
            let parts = full_address.split('<br>');

            // Assign the parts to variables, skipping and ignoring as per instructions
            let address = parts[0]; // First occurrence
            let city = parts[1]; // Second occurrence
            // Skip the third occurrence (Kanrataka in your example)
            let pincode = parts[3]; // Fourth occurrence (ignoring the last)

            frm.set_value('custom_pincode', pincode)
            frm.set_value('custom_full_address', address)
            frm.set_value('custom_delivery_address', address)
        })
        .catch(error => {
            console.error("Error fetching address:", error);
        });

}
function set_warehouse_in_items(frm) {
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Employee',
            filters: [
                ['personal_email', '=', frappe.session.user]
            ],
            fields: ['custom_store', 'custom_cost_center']
        },
        callback: function (r) {
            if (r.message) {
                let employee = r.message[0];
                frm.doc.items.forEach((item, index) => {
                    frappe.model.set_value(item.doctype, item.name, 'warehouse', employee.custom_store);
                    frappe.model.set_value(item.doctype, item.name, 'cost_center', employee.custom_cost_center);
                });
                frm.doc.taxes.forEach((item, index) => {
                    frappe.model.set_value(item.doctype, item.name, 'cost_center', frm.doc.cost_center);
                });
            }
        }
    });
}
function deafult_branch(frm) {
    if (frm.is_new()) {
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Employee',
                filters: [
                    ['personal_email', '=', frappe.session.user]
                ],
                fields: ['employee_name', 'branch']
            },
            callback: function (r) {
                if (r.message) {
                    let employee = r.message[0]
                    console.log(employee);
                    frm.set_value('custom_branch', employee.branch)
                }
            }
        })
        frm.set_value('set_warehouse', frm.doc.custom_store)
    }
}
