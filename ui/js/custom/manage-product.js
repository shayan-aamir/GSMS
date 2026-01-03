var productModal = $("#productModal");
var productTableBody = $("table").find('tbody');

function renderProductRows(products) {
    if (!products || !products.length) {
        productTableBody.html('<tr><td colspan="4" class="text-center">No products found.</td></tr>');
        return;
    }
    var table = '';
    $.each(products, function (index, product) {
        table += '<tr data-id="' + product.products_id + '" data-name="' + product.name + '" data-unit="' + product.uom_id + '" data-price="' + product.price_per_unit + '">' +
            '<td>' + product.name + '</td>' +
            '<td>' + product.uom_name + '</td>' +
            '<td>' + product.price_per_unit + '</td>' +
            '<td><span class="btn btn-xs btn-danger delete-product">Delete</span></td></tr>';
    });
    productTableBody.html(table);
}

function loadProducts(url, params) {
    $.get(url, params)
        .done(function (response) {
            renderProductRows(response);
        })
        .fail(function (xhr) {
            var message = 'Unable to fetch products.';
            if (xhr.responseJSON && xhr.responseJSON.error) {
                message = xhr.responseJSON.error;
            }
            alert(message);
            renderProductRows([]);
        });
}

$(function () {
    loadProducts(productListApiUrl);
});

$("#priceFilterForm").on("submit", function (event) {
    event.preventDefault();
    var minPrice = parseFloat($("#minPrice").val());
    var maxPrice = parseFloat($("#maxPrice").val());

    if (isNaN(minPrice) || isNaN(maxPrice)) {
        alert("Please enter both minimum and maximum price.");
        return;
    }
    if (minPrice > maxPrice) {
        alert("Minimum price must be less than or equal to maximum price.");
        return;
    }
    loadProducts(productByPriceApiUrl, {
        min_price: minPrice,
        max_price: maxPrice
    });
});

$("#clearPriceFilter").on("click", function () {
    $("#minPrice, #maxPrice").val('');
    loadProducts(productListApiUrl);
});

// Save Product
$("#saveProduct").on("click", function () {
    // If we found id value in form then update product detail
    var data = $("#productForm").serializeArray();
    var requestPayload = {
        name: null,
        uom_id: null,
        price_per_unit: null
    };
    for (var i = 0; i < data.length; ++i) {
        var element = data[i];
        switch (element.name) {
            case 'name':
                requestPayload.name = element.value;
                break;
            case 'uoms':
                requestPayload.uom_id = element.value;
                break;
            case 'price':
                requestPayload.price_per_unit = element.value;
                break;
        }
    }
    callApi("POST", productSaveApiUrl, {
        'data': JSON.stringify(requestPayload)
    });
});

$(document).on("click", ".delete-product", function () {
    var tr = $(this).closest('tr');
    var data = {
        products_id: tr.data('id')
    };
    var isDelete = confirm("Are you sure to delete " + tr.data('name') + " item?");
    if (isDelete) {
        callApi("POST", productDeleteApiUrl, data);
    }
});

productModal.on('hide.bs.modal', function () {
    $("#id").val('0');
    $("#name, #unit, #price").val('');
    productModal.find('.modal-title').text('Add New Product');
});

productModal.on('show.bs.modal', function () {
    //JSON data by API call
    $.get(uomListApiUrl, function (response) {
        if (response) {
            var options = '<option value="">--Select--</option>';
            $.each(response, function (index, uom) {
                options += '<option value="' + uom.uom_id + '">' + uom.uom_name + '</option>';
            });
            $("#uoms").empty().html(options);
        }
    });
});