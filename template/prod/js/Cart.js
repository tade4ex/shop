function Cart(classCartCount, classesAddProduct) {
    var self = this;
    this.classCartCount = classCartCount;
    this.cartOffline = [];
    this.get();
    if (classesAddProduct !== null) {
        $(document).on('click', classesAddProduct, function () {
            self.add($(this).attr('data-id'), $(this).attr('data-price'), $(this).attr('data-count'));
        });
    }
}

Cart.prototype.save = function () {
    localStorage.setItem('cart_offline', JSON.stringify(this.cartOffline));
};

Cart.prototype.get = function () {
    this.cartOffline = JSON.parse(localStorage.getItem('cart_offline') || JSON.stringify([]));
    this.viewCount();
};

Cart.prototype.viewCount = function () {
    var $cartCount = $('.' + this.classCartCount);
    if (this.cartOffline.length === 0) {
        $cartCount.html(this.cartOffline.length).hide();
        return false;
    }
    var count = 0;
    this.cartOffline.forEach(function (product) {
        count+= Number(product.count);
    });
    $cartCount.html(count).show();
};

Cart.prototype.add = function (productId, price, count) {
    var isIn = false;
    this.cartOffline = this.cartOffline.map(function (product) {
        if (product.product_id == productId) {
            isIn = true;
            product.price = price;
            product.count = Number(product.count) + Number(count);
        }
        return product;
    });
    if (!isIn) {
        this.cartOffline.push({
            product_id: productId,
            price: price,
            count: count
        });
    }
    this.save();
    this.viewCount();
};

Cart.prototype.change = function (productId, price, count) {
    this.cartOffline = this.cartOffline.map(function (product) {
        if (product.product_id == productId) {
            product.price = price;
            product.count = count;
        }
        return product;
    });
    this.save();
    this.viewCount();
};

Cart.prototype.remove = function (productId) {
    this.cartOffline = this.cartOffline.filter(function (product) { return product.product_id != productId; });
    this.save();
    this.viewCount();
};

Cart.prototype.clear = function () {
    this.cartOffline = [];
    this.save();
    this.viewCount();
};

function CartRender (classContainer, classClearCart, classTotalPrice, cart) {
    var self = this;
    this.cart = cart;
    this.classContainer = classContainer;
    this.classClearCart = classClearCart;
    this.classTotalPrice = classTotalPrice;
    this.products = {};
    this.$container = $('.' + this.classContainer);
    this.ajaxGet();
    this.$container.on('click', '.shop-cart-list__remove', function () {
        var id = $(this).attr('data-id');
        self.cart.remove(id);
        $(this).parent().parent().remove();
        self.calcTotalPrice();
    });
    $(document).on('click', '.' + this.classClearCart, function () {
        self.emptyContainer();
        self.cart.clear();
        self.calcTotalPrice();
    });
    $(document).on('keyup', '.input_product_count', function () {
        var id = $(this).attr('data-id');
        var count = $(this).val();
        var price = Number(self.products[id].price);
        var priceSum = price * count;
        $('.price_sum_view[data-id=' + id + ']').html('$' + priceSum);
        $('.shop-cart-list__remove[data-id=' + id + ']').attr('data-count', count);
        self.cart.change(id, price, count);
        self.calcTotalPrice();
    });
}

CartRender.prototype.ajaxGet = function () {
    this.emptyContainer();
    var productsIds = [];
    var productsCounts = {};
    if (this.cart.cartOffline.length === 0) return false;
    for (var i = 0; i < this.cart.cartOffline.length; i++) {
        var product = this.cart.cartOffline[i];
        if (productsCounts[product.product_id] == null) {
            productsIds.push(product.product_id);
            productsCounts[product.product_id] = Number(product.count);
        } else {
            productsCounts[product.product_id]+= Number(product.count);
        }
    }
    $.get({
        url: '/products/ajaxGetByIds',
        data: { ids: productsIds.join(',') },
        dataType: 'json',
        context: this,
        success: function (json) {
            if (json.result == '0') {
                console.log(json.message);
                return false;
            }
            this.products = {};
            for (var i = 0; i < json.products.length; i++) {
                this.products[json.products[i].id] = json.products[i];
            }
            for (var i = 0; i < productsIds.length; i++) {
                var id = productsIds[i];
                this.$container.append(this.renderItem(this.products[id], productsCounts[id]));
            }
            this.calcTotalPrice();
        },
        error: function () {}
    });
};

CartRender.prototype.emptyContainer = function () {
    this.$container.children().not('.shop-cart-list__row-header').remove();
};

CartRender.prototype.renderItem = function (product, count) {
    var $row = $('<div />', { 'class': 'shop-cart-list__row shop-cart-list__row_content' });
    var $cartCell1 = $('<div />', { 'class': 'shop-cart-list__cell' });
    var $img = $('<img />', { 'class': 'shop-cart-list__img', 'src': product.image_url });
    var $details = $('<div />', { 'class': 'shop-cart-list__details' });
    var $detailsTitle = $('<div />', { 'class': 'shop-cart-list__details_title' }).html(product.name);
    var $detailsColor = $('<div />', { 'class': 'shop-cart-list__details_color' }).html('Red');
    var $detailsSize = $('<div />', { 'class': 'shop-cart-list__details_size' }).html(product.size);
    $details.append($detailsTitle).append($detailsColor).append($detailsSize);
    $cartCell1.append($img).append($details);
    var $cartCell2 = $('<div />', { 'class': 'shop-cart-list__cell shop-cart-list__content-cell' }).html('$' + product.price);
    var $input = $('<input />', { 'class': 'shop-cart-list__number input_product_count', 'data-id': product.id }).val(count);
    var $cartCell3 = $('<div />', { 'class': 'shop-cart-list__cell shop-cart-list__content-cell' });
    $cartCell3.append($input);
    var $cartCell4 = $('<div />', { 'class': 'shop-cart-list__cell shop-cart-list__content-cell price_sum_view', 'data-id': product.id }).html('$' + ( Number(product.price) * count ));
    var $cartCell5 = $('<div />', { 'class': 'shop-cart-list__cell shop-cart-list__content-cell' });
    var $remove = $('<div />', { 'class': 'shop-cart-list__remove', 'data-id': product.id, 'data-count': count });
    $cartCell5.append($remove);
    return $row.append($cartCell1).append($cartCell2).append($cartCell3).append($cartCell4).append($cartCell5);
};

CartRender.prototype.calcTotalPrice = function () {
    var totalPrice = 0;
    this.cart.cartOffline.forEach(function (product) {
        totalPrice+= Number(product.price) * Number(product.count);
    });
    $('.' + this.classTotalPrice).text('$' + totalPrice);
};