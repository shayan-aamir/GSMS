var financeModal = $("#financeModal");
var customers = [];

$(function () {
    // Load customers for dropdown
    $.get(customerListApiUrl, function (response) {
        if (response) {
            customers = response;
            var options = '<option value="">--Select Customer (Optional)--</option>';
            $.each(response, function (index, customer) {
                options += '<option value="' + customer.Customer_id + '">' + customer.Customer_name + ' (' + customer.Email + ')</option>';
            });
            $("#Customer_id").empty().html(options);
        }
    });

    // Load finance records
    loadFinances();
});

function loadFinances() {
    $.get(financeListApiUrl, function (response) {
        if (response) {
            var table = '';
            $.each(response, function (index, finance) {
                var customerName = finance.Customer_name || 'N/A';
                var dateValue = finance.date || '';
                table += '<tr data-id="' + finance.payment_id + '" data-total="' + finance.total_price + '" data-type="' + finance.payment_type + '" data-date="' + dateValue + '" data-customer="' + (finance.Customer_id || '') + '">' +
                    '<td>' + finance.payment_id + '</td>' +
                    '<td>' + finance.total_price + ' Rs</td>' +
                    '<td>' + finance.payment_type + '</td>' +
                    '<td>' + dateValue + '</td>' +
                    '<td>' + customerName + '</td>' +
                    '<td><span class="btn btn-xs btn-primary edit-finance" style="margin-right: 5px;">Edit</span><span class="btn btn-xs btn-danger delete-finance">Delete</span></td></tr>';
            });
            $("table").find('tbody').empty().html(table);
        }
    });
}

// Save Finance
$("#saveFinance").on("click", function () {
    var data = $("#financeForm").serializeArray();
    var requestPayload = {
        payment_id: null,
        total_price: null,
        payment_type: null,
        date: null,
        Customer_id: null
    };
    for (var i = 0; i < data.length; ++i) {
        var element = data[i];
        switch (element.name) {
            case 'payment_id':
                requestPayload.payment_id = element.value;
                break;
            case 'total_price':
                requestPayload.total_price = element.value;
                break;
            case 'payment_type':
                requestPayload.payment_type = element.value;
                break;
            case 'date':
                requestPayload.date = element.value;
                break;
            case 'Customer_id':
                requestPayload.Customer_id = element.value || null;
                break;
        }
    }

    if (requestPayload.payment_id && requestPayload.payment_id != '0') {
        // Update existing finance
        callApi("POST", financeUpdateApiUrl, {
            'data': JSON.stringify(requestPayload)
        });
    } else {
        // Insert new finance
        callApi("POST", financeSaveApiUrl, {
            'data': JSON.stringify(requestPayload)
        });
    }
});

$(document).on("click", ".delete-finance", function () {
    var tr = $(this).closest('tr');
    var data = {
        payment_id: tr.data('id')
    };
    var isDelete = confirm("Are you sure to delete finance record #" + tr.data('id') + "?");
    if (isDelete) {
        callApi("POST", financeDeleteApiUrl, data);
    }
});

$(document).on("click", ".edit-finance", function () {
    var tr = $(this).closest('tr');
    $("#payment_id").val(tr.data('id'));
    $("#total_price").val(tr.data('total'));
    $("#payment_type").val(tr.data('type'));
    $("#date").val(tr.data('date'));
    $("#Customer_id").val(tr.data('customer') || '');
    financeModal.find('.modal-title').text('Edit Finance Record');
    financeModal.modal('show');
});

financeModal.on('hide.bs.modal', function () {
    $("#payment_id").val('0');
    $("#total_price, #payment_type, #date").val('');
    $("#Customer_id").val('');
    financeModal.find('.modal-title').text('Add New Finance Record');
});

financeModal.on('show.bs.modal', function () {
    // Refresh customer list
    $.get(customerListApiUrl, function (response) {
        if (response) {
            var options = '<option value="">--Select Customer (Optional)--</option>';
            $.each(response, function (index, customer) {
                options += '<option value="' + customer.Customer_id + '">' + customer.Customer_name + ' (' + customer.Email + ')</option>';
            });
            $("#Customer_id").empty().html(options);
        }
    });
});

