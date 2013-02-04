(function(){
  function CacheCart(){
    var _cartDiv = null,
        _productsData = null,
        _cartConfig = null,
        _isOpen = false,
        _items = {},
        _isInternationalShipping = false,
        _cookieKey = 'cacheCart';

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
      // pull local storage if needed
      var storedCartData = window.cacheCart.Cookie.get( _cookieKey );
      if( storedCartData && storedCartData != '' ) {
        var items = storedCartData.split('|');
        for( var i=0; i < items.length; i++ ) {
          _items[items[i].split(',')[0]] = items[i].split(',')[1];
        }
        showCart();
        drawCart();
      }
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
      storeCart();
      $("html, body").animate({ scrollTop: 0 }, 500);
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
      storeCart();
    };

    var clearCart = function() {
      for(var item in _items) delete _items[item];
      hideCart();
    };

    var storeCart = function() {
      var serialStorage = '';
      for(var item in _items) {
        var itemId = item;
        var itemQuantity = _items[item];
        var product = _productsData[itemId];
        if( serialStorage != '' ) serialStorage += '|';
        serialStorage += itemId+','+itemQuantity
      }
      console.log('serialStorage',serialStorage);
      window.cacheCart.Cookie.set( _cookieKey, serialStorage );
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

        shippingTotal += calcShippingForProduct( product, itemQuantity );
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

        // calculate product shipping
        // var productShipping = calcShippingForProduct( product, itemQuantity );
        
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
        htmlStr += '</div>';

        htmlStr += '<div class="cacheCartProductActions">';
        htmlStr += '<a href="javascript:window.cacheCart.addItem(\''+itemId+'\');" class="cacheCartPlus">+</a>';
        htmlStr += '<span class="cacheCartQuantity">' + itemQuantity + '</span>';
        htmlStr += '<a href="javascript:window.cacheCart.removeItem(\''+itemId+'\');" class="cacheCartMinus">-</a>';
        htmlStr += '</div>';

        htmlStr += '</div>';
      }  

      htmlStr += '</div>';

      htmlStr += '<div class="cacheCartSubTotal">Items total: $' + window.cacheCart.Formatter.formatDollarsCents( priceTotal ) + '</div>';
      htmlStr += '<div class="cacheCartSubTotal">Shipping: $' + window.cacheCart.Formatter.formatDollarsCents( shippingTotal ) + '</div>';
      htmlStr += '<div class="cacheCartTotal">Total: $' + window.cacheCart.Formatter.formatDollarsCents( totalWithShipping )+ '</div>';

      htmlStr += '<div id="cacheCartActions">';
      htmlStr += '<img src="./credit-cards.gif" align="left">';
      // htmlStr += '<a href="javascript:window.cacheCart.clearCart();">Clear Cart</a>';
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

        // calc product price and shipping
        var priceTimesQuantity = product['price'] * itemQuantity; 
        var itemShippingTotal = calcShippingForProduct( product, itemQuantity );

        // add standard options to the address
        var intlTextAdd = "";
        // if( $cartObj['intl'] == "true" ) { $intlTextAdd = " [intl]"; }
        checkoutLink += '&item_name_' + counter + '=' + escape( product['title'] + intlTextAdd );
        checkoutLink += '&item_number_' + counter + '=' + itemId;
        checkoutLink += '&quantity_' + counter + '=' + itemQuantity;
        checkoutLink += '&amount_' + counter + '=' + product['price'];
        checkoutLink += '&shipping_' + counter + '=' + itemShippingTotal;
        
        // increment paypal querystring vars
        counter++;
      }

      return checkoutLink;
    };

    var calcShippingForProduct = function( product, quantity ) {
      // calculate shipping based on incrementing
      var numFullPriceShipping = Math.ceil( quantity / product['shipping']['increment'] );
      var numNextPriceShipping = quantity - numFullPriceShipping;
      var shipping = 0;

      // add shipping depending on intl status
      if( _isInternationalShipping == true ) {
        shipping += product['shipping']['first-intl'] * numFullPriceShipping;
        shipping += product['shipping']['next-intl'] * numNextPriceShipping;
      } else {
        shipping += product['shipping']['first'] * numFullPriceShipping;
        shipping += product['shipping']['next'] * numNextPriceShipping;
      }

      return shipping;
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

  window.cacheCart = new CacheCart();

  // Cookie storage --------------------------------------------------------
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

  // Number formatting ----------------------------------------------------
  var Formatter = {};

  /**
   *  Returns a number with the traditional US currency format.
   *  @param  str A numberic monetary value.
   *  @return A number (in string format), with traditional US currency formatting.
   *  @use    {@code var moneyVal = Formatter.formatDollarsCents('303.333333');}
   */
  Formatter.formatDollarsCents = function(str) {
    var numParts;
    numParts = (str + '').split('.');
    if (numParts.length === 1) {
      numParts.push('00');
    } else {
      while (numParts[1].length < 2) {
        numParts[1] += '0';
      }
      numParts[1] = numParts[1].substr(0, 2);
    }
    return numParts.join('.');
  };

  /**
   *  Returns a string, formatted with commas in between every 3 numbers.
   *  @param  str A number.
   *  @return A formatted number (in string format).
   *  @use    {@code var formattedNumber = Formatter.addCommasToNumber('3000000');}
   */
  Formatter.addCommasToNumber = function(str) {
    x = (str + '').split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
  };

  window.cacheCart.Formatter = Formatter;

})();
