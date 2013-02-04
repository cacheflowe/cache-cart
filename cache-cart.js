// Cache Cart namespace
window.cacheCart = {};

// Cookie storage ------------------------------------------------------------
(function(){
  // original from http://www.quirksmode.org/js/cookies.html
  function Cookie(){}

  Cookie.set = function(name,value,days) {
    if (days) {
      var date = new Date();
      date.setTime(date.getTime()+(days*24*60*60*1000));
      var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
  };

  Cookie.get = function(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
  };

  Cookie.dispose = function(name) {
    Cookie.set(name,"",-1);
  };

  window.cacheCart.Cookie = Cookie;
})();


// Cart ------------------------------------------------------------------------
(function(){
  function CacheCart(){
    var _cartDiv = null,
        _productsData = null,
        _cartConfig = null,
        _isOpen = false,
        _items = {},
        _isInternationalShipping = false;

    var init = function( cartJSON ) {
      createCartElement();
      loadCartData( cartJSON );
    };

    var createCartElement = function() {
      // create and insert cart element as the first <body> element
      _cartDiv = document.createElement("div");
      _cartDiv.setAttribute('id','cacheCart');
      _cartDiv.setAttribute('class','hidden');
      $(document.body).prepend(_cartDiv);
    };

    var loadCartData = function( cartJSON ) {
      $.ajax({
        dataType: "json",
        url: cartJSON,
        data: null,
        success: cartDataLoaded
      });
    };

    var cartDataLoaded = function( data ) {
      _cartConfig = data.config;
      _productsData = data.products;
    };

    // store product ID and number added into hash
    var addItem = function( itemId ) {
      // update cart items count
      if( _items[itemId] ) {
        _items[itemId]++;
      } else {
        _items[itemId] = 1;
      }
      // show cart div
      if(!_isOpen) {
        showCart();
      }
      // update html
      drawCart();
    };

    // decrement product count
    var removeItem = function( itemId ) {
      // update cart items count
      if( _items[itemId] ) {
        _items[itemId]--;
      } 
      if( _items[itemId] == 0 ) {
        delete _items[itemId];
      }
      // show cart div
      if(_isOpen && numItems() == 0) {
        hideCart();
      } else {
        drawCart();
      }
    };

    var clearCart = function() {
      for(var item in _items) delete _items[item];
      hideCart();
    };

    var numItems = function() {
      var num = 0;
      for(var item in _items) num++;
      return num;
    };

    var drawCart = function() {
      // calc price
      var shippingTotal = 0;
      var priceTotal = 0;
      var totalWithShipping = 0;
    
      // loop through cart items, adding up cost
      for(var item in _items) {
        var itemId = item;
        var itemQuantity = _items[item];
        var product = _productsData[itemId];

        // calculate and add shipping
        var numFullPriceShipping = Math.ceil( itemQuantity / product['shipping']['increment'] );
        var numNextPriceShipping = itemQuantity - numFullPriceShipping;

        // add shipping depending on intl status
        if( _isInternationalShipping == true ) {
          shippingTotal += product['shipping']['first-intl'] * numFullPriceShipping;
          shippingTotal += product['shipping']['next-intl'] * numNextPriceShipping;
        } else {
          shippingTotal += product['shipping']['first'] * numFullPriceShipping;
          shippingTotal += product['shipping']['next'] * numNextPriceShipping;
        }

        // add up price
        priceTotal += product['price'] * itemQuantity;
      }

      // calculate total order price w/shipping
      totalWithShipping = priceTotal + shippingTotal;
    
      // print table
      var htmlStr = '';
      htmlStr += '<div id="cacheCartInner">';
      htmlStr += '<div id="cacheCartTitle">' + _cartConfig['cart-title'] + '</div>';
      htmlStr += '<div id="cacheCartProducts">';            
            
      // loop through all cart items
      for(var item in _items) {
        var itemId = item;
        var itemQuantity = _items[item];
        var product = _productsData[itemId];

        // calc product price
        var priceTimesQuantity = product['price'] * itemQuantity; 

        // calculate and add shipping
        var shippingTotal = 0;
        var numFullPriceShipping = Math.ceil( itemQuantity / product['shipping']['increment'] );
        var numNextPriceShipping = itemQuantity - numFullPriceShipping;
        
        if( _isInternationalShipping == true ) {
          shippingTotal += product['shipping']['first-intl'] * numFullPriceShipping;
          shippingTotal += product['shipping']['next-intl'] * numNextPriceShipping;
        } else {
          shippingTotal += product['shipping']['first'] * numFullPriceShipping;
          shippingTotal += product['shipping']['next'] * numNextPriceShipping;
        }
        
        // print item's html
        var productLink = '';
        var productLinkClose = '';
        if( product['url'] ) {
          productLink = '<a href="'+product['url']+'">';
          productLinkClose = '</a>';
        }
        htmlStr += '<div class="cacheCartItem clearfix">';

        htmlStr += '<div class="cacheCartItemDescription">';
        htmlStr += productLink;
        htmlStr += product['title'];
        htmlStr += productLinkClose;
        htmlStr += ' (' + itemQuantity + ')';
        htmlStr += '</div>';

        htmlStr += '<div class="cacheCartProductActions">';
        htmlStr += '<a href="javascript:window.cacheCart.cart.addItem(\''+itemId+'\');" class="cacheCartPlus">+</a>';
        htmlStr += '<a href="javascript:window.cacheCart.cart.removeItem(\''+itemId+'\');" class="cacheCartMinus">-</a>';
        htmlStr += '</div>';

        htmlStr += '</div>';


        // htmlStr += '<td><a href="javascript:mycart.addToCart(\''+itemId+'\');">+</a></td>';    // add another
        // htmlStr += '<td><a href="javascript:mycart.clearProduct(\''+itemId+'\');">-</a></td>';  // remove
        // htmlStr += '<td>'+priceTimesQuantity+'</td>';                    // price based on number in cart
        // htmlStr += '<td>'+shippingTotal+'</td>';                     // shipping based on number in cart
      }  

      htmlStr += '</div>';

      htmlStr += '<div id="cacheCartTotal">Total: $'+totalWithShipping+'</div>';

      htmlStr += '<div id="cacheCartActions">';
      htmlStr += '<a href="javascript:window.cacheCart.cart.clearCart();">Clear Cart</a>';
      htmlStr += '<a target="_blank" href="';
      htmlStr += getCheckoutLink();
      htmlStr += '">Check Out</a>';
      htmlStr += '</div>';

      htmlStr += '</div>';

      $(_cartDiv).html(htmlStr);
    };

    var getCheckoutLink = function() {
      var checkoutLink = 'https://www.paypal.com/cgi-bin/webscr?';
      checkoutLink += '&cmd=_cart';
      checkoutLink += '&upload=1';
      checkoutLink += '&business=' + _cartConfig['paypal-email'];
      checkoutLink += '&rm=0';
      checkoutLink += '&currency_code=USD';
      checkoutLink += '&lc=US';
      checkoutLink += '&tax_cart=0';
      checkoutLink += '&handling_cart=0';
    
      // loop through all cart items
      counter = 1; // lets us print the total on the first pass
      for(var item in _items) {
        var itemId = item;
        var itemQuantity = _items[item];
        var product = _productsData[itemId];

        // calc product price
        var priceTimesQuantity = product['price'] * itemQuantity; 

        // add standard options to the address
        var intlTextAdd = "";
        // if( $cartObj['intl'] == "true" ) { $intlTextAdd = " [intl]"; }
        checkoutLink += '&item_name_' + counter + '=' + escape( product['title'] + intlTextAdd );
        checkoutLink += '&item_number_' + counter + '=' + itemId;
        checkoutLink += '&quantity_' + counter + '=' + itemQuantity;
        checkoutLink += '&amount_' + counter + '=' + product['price'];
        
        // calculate and add shipping
        var itemShippingTotal = 0;
        numFullPriceShipping = Math.ceil( itemQuantity / product['shipping']['increment'] );   // get number of products at full shipping price
        numNextPriceShipping = itemQuantity - numFullPriceShipping;             // get number of products at secondary shipping price
        
        if( _isInternationalShipping == true ) {
          itemShippingTotal = itemShippingTotal + product['shipping']['first-intl'] * numFullPriceShipping;
          itemShippingTotal = itemShippingTotal + product['shipping']['next-intl'] * numNextPriceShipping;
        } else {
          itemShippingTotal = itemShippingTotal + product['shipping']['first'] * numFullPriceShipping;
          itemShippingTotal = itemShippingTotal + product['shipping']['next'] * numNextPriceShipping;
        }
        
        // add calculated shipping to address
        checkoutLink += '&shipping_' + counter + '=' + itemShippingTotal;
        
        // increment paypal querystring vars
        counter++;
      }

      return checkoutLink;
    };

    var showCart = function() {
      _isOpen = true;
      $(_cartDiv).removeClass('hidden');

    };

    var hideCart = function() {
      _isOpen = false;
      $(_cartDiv).addClass('hidden');
    };

    return {
      init: init,
      addItem: addItem,
      removeItem: removeItem,
      clearCart: clearCart
    }
  }

  window.cacheCart.cart = new CacheCart();
})();

