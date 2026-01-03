var productPrices = {};
var editingOrderId = getQueryParam('orderId');
var isEditMode = !!editingOrderId;

$(function () {
    initializeOrderPage();
    $("#saveOrder").on("click", handleSaveOrder);
});

function initializeOrderPage() {
    updateFormTitle(isEditMode ? editingOrderId : null);
    var productsPromise = getProductList();
    var customersPromise = getCustomerList();
    $.when(productsPromise, customersPromise).done(function () {
        if (isEditMode) {
            loadOrderForEdit(editingOrderId);
        } else {
            ensureAtLeastOneRow();
            calculateValue();
        }
    }).fail(function () {
        alert('Unable to load products or customers. Please refresh the page.');
    });
}

function getProductList() {
    return $.get(productListApiUrl, function (response) {
        productPrices = {};
        if (!response) {
            return;
        }
        var options = '<option value="">--Select--</option>';
        $.each(response, function (index, products) {
            options += '<option value="' + products.products_id + '">' + products.name + '</option>';
            productPrices[products.products_id] = products.price_per_unit;
        });
        $(".product-box").find("select").empty().html(options);
    }).fail(function () {
        alert('Failed to load products. Please refresh the page.');
    });
}

function getCustomerList() {
    return $.get(customerListApiUrl, function (response) {
        if (!response) {
            return;
        }
        var options = '<option value="">--Select Customer--</option>';
        $.each(response, function (index, customer) {
            options += '<option value="' + customer.Customer_id + '" data-name="' + customer.Customer_name + '">' + customer.Customer_name + ' (' + customer.Email + ')</option>';
        });
        $("#customerSelect").empty().html(options);
    }).fail(function () {
        alert('Failed to load customers. Please refresh the page.');
    });
}

function loadOrderForEdit(orderId) {
    $.get(orderDetailsApiUrl + '/' + orderId, function (response) {
        var order = response && response.order_id ? response : null;
        if (!order) {
            alert('Order not found.');
            window.location.href = 'index.html';
            return;
        }
        updateFormTitle(orderId);
        $('#customerName').val(order.customer_name || '');
        selectCustomerByName(order.customer_name);
        $('#product_grand_total').val(parseFloat(order.total || 0).toFixed(2));
        $('#itemsInOrder').empty();
        var details = order.order_details || [];
        if (!details.length) {
            ensureAtLeastOneRow();
        } else {
            $.each(details, function (idx, item) {
                addProductRow({
                    products_id: item.products_id,
                    quantity: item.quantity,
                    price_per_unit: item.price_per_unit,
                    total_price: item.total_price
                });
            });
            calculateValue();
        }
    }).fail(function () {
        alert('Unable to load the selected order.');
        window.location.href = 'index.html';
    });
}

function selectCustomerByName(name) {
    if (!name) {
        $('#customerSelect').val('');
        return;
    }
    $("#customerSelect option").each(function () {
        if ($(this).data('name') === name) {
            $('#customerSelect').val($(this).val());
            return false;
        }
    });
}

function updateFormTitle(orderId) {
    if (orderId) {
        $('#orderFormTitle').text('Edit Order #' + orderId);
        $('#saveOrder').text('Update Order');
    } else {
        $('#orderFormTitle').text('New Order');
        $('#saveOrder').text('Save Order');
    }
}

function ensureAtLeastOneRow() {
    if ($('#itemsInOrder .product-item').length === 0) {
        addProductRow();
    }
}

function addProductRow(itemData) {
    var $row = $(".product-box .product-item").first().clone();
    var $select = $row.find('.cart-product');
    var productId = itemData && itemData.products_id ? itemData.products_id : '';
    $select.val(productId);

    var priceValue = itemData && itemData.price_per_unit !== undefined ? parseFloat(itemData.price_per_unit) : (productId ? parseFloat(productPrices[productId]) : 0);
    priceValue = isNaN(priceValue) ? 0 : priceValue;
    $row.find('#product_price').val(priceValue.toFixed(2));

    var quantityValue = itemData && itemData.quantity !== undefined ? parseFloat(itemData.quantity) : 1;
    quantityValue = isNaN(quantityValue) ? 1 : quantityValue;
    $row.find('.product-qty').val(quantityValue);

    var totalValue = itemData && itemData.total_price !== undefined ? parseFloat(itemData.total_price) : priceValue * quantityValue;
    totalValue = isNaN(totalValue) ? 0 : totalValue;
    $row.find('#item_total').val(totalValue.toFixed(2));

    $('#itemsInOrder').append($row);
}

$("#addMoreButton").click(function () {
    addProductRow();
    calculateValue();
});

$(document).on("click", ".remove-row", function () {
    $(this).closest('.row').remove();
    ensureAtLeastOneRow();
    calculateValue();
});

$(document).on("change", ".cart-product", function () {
    var products_id = $(this).val();
    var price = parseFloat(productPrices[products_id]) || 0;
    $(this).closest('.row').find('#product_price').val(price.toFixed(2));
    calculateValue();
});

$(document).on("change", ".product-qty", function () {
    calculateValue();
});

function handleSaveOrder(event) {
    event.preventDefault();
    var payload = buildOrderPayload();
    if (!payload) {
        return;
    }
    var url = isEditMode ? orderUpdateApiUrl : orderSaveApiUrl;
    callApi("POST", url, {
        'data': JSON.stringify(payload)
    }, {
        redirectTo: 'index.html'
    });
}

function buildOrderPayload() {
    var payload = {
        customer_name: null,
        grand_total: $('#product_grand_total').val(),
        order_details: []
    };

    var selectedOption = $('#customerSelect option:selected');
    if (selectedOption.val()) {
        payload.customer_name = selectedOption.data('name') || selectedOption.text().split(' (')[0];
    }

    var manualName = $('#customerName').val();
    if (manualName) {
        payload.customer_name = manualName;
    }

    if (!payload.customer_name) {
        alert('Please select or enter a customer name.');
        return null;
    }

    $('#itemsInOrder .product-item').each(function () {
        var productId = $(this).find('.cart-product').val();
        if (!productId) {
            return;
        }
        var quantity = parseFloat($(this).find('.product-qty').val()) || 0;
        var pricePerUnit = parseFloat($(this).find('#product_price').val()) || 0;
        var totalPrice = parseFloat($(this).find('#item_total').val());
        if (isNaN(totalPrice)) {
            totalPrice = quantity * pricePerUnit;
        }
        payload.order_details.push({
            products_id: productId,
            quantity: quantity,
            price_per_unit: pricePerUnit,
            total_price: totalPrice
        });
    });

    if (!payload.order_details.length) {
        alert('Add at least one product to the order.');
        return null;
    }

    if (isEditMode) {
        payload.order_id = editingOrderId;
    }

    return payload;
}

// Handle customer selection from dropdown
$(document).on("change", "#customerSelect", function () {
    var selectedOption = $(this).find('option:selected');
    var customerName = selectedOption.data('name');
    if (customerName) {
        $("#customerName").val(customerName);
    }
});

function getQueryParam(param) {
    var queryString = window.location.search.substring(1);
    var vars = queryString.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) === param) {
            return decodeURIComponent(pair[1] || '');
        }
    }
    return null;
}