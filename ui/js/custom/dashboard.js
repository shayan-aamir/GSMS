$(function () {
    loadOrdersIntoTable();

    $("#viewOrdersBtn").on("click", function (e) {
        e.preventDefault();
        loadOrdersIntoTable();
    });
});

function loadOrdersIntoTable() {
    $.get(orderListApiUrl, function (response) {
        if (!response) {
            return;
        }
        renderOrdersTable(response, ".table-bordered tbody");
        attachViewDetailsHandler(response);
    }).fail(function () {
        alert('Unable to load orders, please refresh and try again.');
    });
}

function renderOrdersTable(orderList, targetSelector) {
    var table = '';
    var totalCost = 0;
    $.each(orderList, function (index, order) {
        var orderTotal = parseFloat(order.total || 0);
        var safeOrderTotal = isNaN(orderTotal) ? 0 : orderTotal;
        totalCost += safeOrderTotal;
        table += '<tr>' +
            '<td>' + (order.datetime || '-') + '</td>' +
            '<td>' + (order.order_id || '-') + '</td>' +
            '<td>' + (order.customer_name || '-') + '</td>' +
            '<td>' + safeOrderTotal.toFixed(2) + ' Rs</td>' +
            '<td class="text-nowrap">' +
            '<button class="view-details btn btn-sm btn-info" style="margin-right:4px;" data-index="' + index + '">View</button>' +
            '<button class="edit-order btn btn-sm btn-secondary" style="margin-right:4px;" data-order-id="' + order.order_id + '">Edit</button>' +
            '<button class="delete-order btn btn-sm btn-danger" data-order-id="' + order.order_id + '" data-order-name="' + (order.customer_name || 'this customer') + '" data-order-total="' + safeOrderTotal.toFixed(2) + '">Delete</button>' +
            '</td></tr>';
    });
    table += '<tr><td colspan="3" style="text-align: end"><b>Total</b></td><td><b>' + totalCost.toFixed(2) + ' Rs</b></td><td></td></tr>';
    $(targetSelector).empty().html(table);
}

function attachViewDetailsHandler(orderList) {
    $(document).off('click', '.view-details').on('click', '.view-details', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var idx = $(this).data('index');
        var order = orderList[idx];
        if (!order) {
            return;
        }
        var detailsUrl = orderDetailsApiUrl + '/' + order.order_id;
        $.get(detailsUrl, function (response) {
            var orderDetails = response.order_details || response.details || response;
            var enrichedOrder = $.extend({}, order, { order_details: orderDetails });
            renderOrderDetailsPanel(enrichedOrder);
            showOrderDetailsModal(enrichedOrder);
        }).fail(function () {
            alert('Unable to load order details. Please try again.');
        });
    });
}

$(document).on('click', '.edit-order', function (e) {
    e.preventDefault();
    var orderId = $(this).data('order-id');
    if (!orderId) {
        alert('Unable to determine which order to edit.');
        return;
    }
    window.location.href = 'order.html?orderId=' + orderId;
});

$(document).on('click', '.delete-order', function (e) {
    e.preventDefault();
    var orderId = $(this).data('order-id');
    var customerName = $(this).data('order-name') || 'this customer';
    var orderTotal = $(this).data('order-total') || '0.00';
    if (!orderId) {
        alert('Unable to determine which order to delete.');
        return;
    }
    var confirmed = confirm('Delete order #' + orderId + ' for ' + customerName + ' (Total ' + orderTotal + ' Rs)?');
    if (!confirmed) {
        return;
    }
    callApi('POST', orderDeleteApiUrl, {
        order_id: orderId
    });
});

function formatCurrency(value) {
    var num = parseFloat(value);
    if (isNaN(num)) {
        return null;
    }
    return num.toFixed(2);
}

function renderOrderDetailsPanel(order) {
    var panel = $('#orderDetailsPanel');
    if (panel.length === 0) {
        // fallback to modal rendering if panel not found
        showOrderDetailsModal(order);
        return;
    }

    $('#orderDetailsHeading').text('Order Details');
    $('#orderDetailsNumber').text(order.order_id || '-');
    $('#orderDetailsCustomer').text(order.customer_name || '-');
    $('#orderDetailsDate').text(order.datetime || '-');

    var tbody = $('#orderDetailsTable tbody');
    tbody.empty();
    var details = order.order_details || [];
    var grandTotal = 0;

    if (!details.length) {
        tbody.append('<tr><td colspan="4" class="text-center text-muted">No items for this order.</td></tr>');
    } else {
        $.each(details, function (i, item) {
            var qty = parseFloat(item.quantity);
            var displayQty = isNaN(qty) ? (item.quantity || '-') : qty;
            var pricePerUnit = formatCurrency(item.price_per_unit);
            var lineTotal = formatCurrency(item.total_price);
            if (!isNaN(parseFloat(item.total_price))) {
                grandTotal += parseFloat(item.total_price);
            }
            var rowHtml = '<tr>' +
                '<td>' + (item.product_name || '-') + '</td>' +
                '<td>' + displayQty + '</td>' +
                '<td>' + (pricePerUnit !== null ? pricePerUnit + ' Rs' : '-') + '</td>' +
                '<td>' + (lineTotal !== null ? lineTotal + ' Rs' : '-') + '</td>' +
                '</tr>';
            tbody.append(rowHtml);
        });
    }

    $('#orderDetailsGrandTotal').html('<strong>' + grandTotal.toFixed(2) + ' Rs</strong>');

    panel.slideDown();
    $('html, body').animate({
        scrollTop: panel.offset().top - 20
    }, 400);
}

// fallback modal (used only if panel missing from DOM)
function showOrderDetailsModal(order) {
    var modalId = 'orderDetailsModal';
    var modal = $('#' + modalId);
    if (modal.length === 0) {
        var modalHtml = '<div class="modal fade" id="' + modalId + '" tabindex="-1" role="dialog">' +
            '<div class="modal-dialog" role="document">' +
            '<div class="modal-content">' +
            '<div class="modal-header">' +
            '<h5 class="modal-title">Order Details</h5>' +
            '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
            '<span aria-hidden="true">&times;</span>' +
            '</button>' +
            '</div>' +
            '<div class="modal-body"><div id="orderDetailsContent"></div></div>' +
            '<div class="modal-footer">' +
            '<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>' +
            '</div>' +
            '</div></div></div>';
        $('body').append(modalHtml);
        modal = $('#' + modalId);
    }
    var details = order.order_details || [];
    var html = '<table class="table table-bordered"><thead><tr>' +
        '<th>Product</th><th>Quantity</th><th>Price/Unit</th><th>Total</th></tr></thead><tbody>';
    if (!details || details.length === 0) {
        html += '<tr><td colspan="4">No details available</td></tr>';
    } else {
        $.each(details, function (i, item) {
            var qty = parseFloat(item.quantity);
            var displayQty = isNaN(qty) ? (item.quantity || '-') : qty;
            var pricePerUnit = formatCurrency(item.price_per_unit);
            var lineTotal = formatCurrency(item.total_price);
            html += '<tr>' +
                '<td>' + (item.product_name || '-') + '</td>' +
                '<td>' + displayQty + '</td>' +
                '<td>' + (pricePerUnit !== null ? pricePerUnit + ' Rs' : '-') + '</td>' +
                '<td>' + (lineTotal !== null ? lineTotal + ' Rs' : '-') + '</td>' +
                '</tr>';
        });
    }
    html += '</tbody></table>';
    $('#orderDetailsContent').html(html);
    modal.modal('show');
}