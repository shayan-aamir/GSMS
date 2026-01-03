var customerModal = $("#customerModal");
$(function () {

    //JSON data by API call
    $.get(customerListApiUrl, function (response) {
        if (response) {
            var table = '';
            $.each(response, function (index, customer) {
                table += '<tr data-id="' + customer.Customer_id + '" data-name="' + customer.Customer_name + '" data-email="' + customer.Email + '" data-phone="' + customer.PhoneNum + '">' +
                    '<td>' + customer.Customer_id + '</td>' +
                    '<td>' + customer.Customer_name + '</td>' +
                    '<td>' + customer.Email + '</td>' +
                    '<td>' + customer.PhoneNum + '</td>' +
                    '<td><span class="btn btn-xs btn-primary edit-customer" style="margin-right: 5px;">Edit</span><span class="btn btn-xs btn-danger delete-customer">Delete</span></td></tr>';
            });
            $("table").find('tbody').empty().html(table);
        }
    });
});

// Save Customer
$("#saveCustomer").on("click", function () {
    var data = $("#customerForm").serializeArray();
    var requestPayload = {
        Customer_id: null,
        Customer_name: null,
        Email: null,
        PhoneNum: null
    };
    for (var i = 0; i < data.length; ++i) {
        var element = data[i];
        switch (element.name) {
            case 'Customer_id':
                requestPayload.Customer_id = element.value;
                break;
            case 'Customer_name':
                requestPayload.Customer_name = element.value;
                break;
            case 'Email':
                requestPayload.Email = element.value;
                break;
            case 'PhoneNum':
                requestPayload.PhoneNum = element.value;
                break;
        }
    }

    if (requestPayload.Customer_id && requestPayload.Customer_id != '0') {
        // Update existing customer
        callApi("POST", customerUpdateApiUrl, {
            'data': JSON.stringify(requestPayload)
        });
    } else {
        // Insert new customer
        callApi("POST", customerSaveApiUrl, {
            'data': JSON.stringify(requestPayload)
        });
    }
});

$(document).on("click", ".delete-customer", function () {
    var tr = $(this).closest('tr');
    var data = {
        Customer_id: tr.data('id')
    };
    var isDelete = confirm("Are you sure to delete " + tr.data('name') + "?");
    if (isDelete) {
        callApi("POST", customerDeleteApiUrl, data);
    }
});

$(document).on("click", ".edit-customer", function () {
    var tr = $(this).closest('tr');
    $("#Customer_id").val(tr.data('id'));
    $("#Customer_name").val(tr.data('name'));
    $("#Email").val(tr.data('email'));
    $("#PhoneNum").val(tr.data('phone'));
    customerModal.find('.modal-title').text('Edit Customer');
    customerModal.modal('show');
});

customerModal.on('hide.bs.modal', function () {
    $("#Customer_id").val('0');
    $("#Customer_name, #Email, #PhoneNum").val('');
    customerModal.find('.modal-title').text('Add New Customer');
});

