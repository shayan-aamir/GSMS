// Define your api here
var productListApiUrl = 'http://127.0.0.1:5000/getProducts';
var productByPriceApiUrl = 'http://127.0.0.1:5000/getProductsByPrice';
var uomListApiUrl = 'http://127.0.0.1:5000/getUOM';
var productSaveApiUrl = 'http://127.0.0.1:5000/insertProduct';
var productDeleteApiUrl = 'http://127.0.0.1:5000/deleteProduct';
var orderListApiUrl = 'http://127.0.0.1:5000/getAllOrders';
var orderSaveApiUrl = 'http://127.0.0.1:5000/insertOrder';
var orderUpdateApiUrl = 'http://127.0.0.1:5000/updateOrder';
var orderDeleteApiUrl = 'http://127.0.0.1:5000/deleteOrder';
var orderDetailsApiUrl = 'http://127.0.0.1:5000/getOrderDetails';
// Customer APIs
var customerListApiUrl = 'http://127.0.0.1:5000/getCustomers';
var customerSaveApiUrl = 'http://127.0.0.1:5000/insertCustomer';
var customerUpdateApiUrl = 'http://127.0.0.1:5000/updateCustomer';
var customerDeleteApiUrl = 'http://127.0.0.1:5000/deleteCustomer';
// Finance APIs
var financeListApiUrl = 'http://127.0.0.1:5000/getFinances';
var financeSaveApiUrl = 'http://127.0.0.1:5000/insertFinance';
var financeUpdateApiUrl = 'http://127.0.0.1:5000/updateFinance';
var financeDeleteApiUrl = 'http://127.0.0.1:5000/deleteFinance';

function callApi(method, url, data, options) {
    options = options || {};
    $.ajax({
        method: method,
        url: url,
        data: data
    }).done(function (response) {
        if (typeof options.onSuccess === 'function') {
            options.onSuccess(response);
            return;
        }
        if (options.redirectTo) {
            window.location.href = options.redirectTo;
            return;
        }
        if (!options.silent) {
            window.location.reload();
        }
    }).fail(function (xhr) {
        var message = 'Request failed. Please try again.';
        if (xhr.responseJSON && xhr.responseJSON.error) {
            message = xhr.responseJSON.error;
        }
        if (typeof options.onError === 'function') {
            options.onError(message, xhr);
            return;
        }
        alert(message);
    });
}

function calculateValue() {
    var total = 0;
    $(".product-item").each(function (index) {
        var qty = parseFloat($(this).find('.product-qty').val());
        var price = parseFloat($(this).find('#product_price').val());
        price = price * qty;
        $(this).find('#item_total').val(price.toFixed(2));
        total += price;
    });
    $("#product_grand_total").val(total.toFixed(2));
}

//To enable bootstrap tooltip globally
// $(function () {
//     $('[data-toggle="tooltip"]').tooltip()
// });