# Cache Cart
A simple Javascript-powered PayPal shopping cart that doesn't require any back end code. Check out the [demo](http://cacheflowe.github.com/cache-cart/).

#### Instructions:
###### Import the css:
```
<link href="./cache-cart.css" media="screen" rel="stylesheet" type="text/css" />
```

###### Import reqwest for the ajax call, and the Cache Cart javascript:
```
<script src="./reqwest.min.js" type="text/javascript"></script>
<script src="./cache-cart.js" type="text/javascript"></script>
```

###### Customize the products and configuration in **products.json**
* Change the `cart-title` to match your site
* Change the `paypal-email` to link to your PayPal merchant account

###### Load your product data JSON when the site is ready:
```
window.cacheCart.init('./products.json', cartLoadedCallback);
```

###### Create links in your page that tell the cart to add a product:
```
<a data-cachecart-buy-link="PSS003" href="#PSS003">Buy PSS003</a>
Inventory: <span data-cachecart-inventory="PSS003">58</span>
```

###### Active the links in your page, scoped to their container:
```
function cartLoadedCallback() {
	window.cacheCart.parseLinks(document.body);
}
```

###### Dispose the links to clean up event listeners if you're removing their container in a single-page app:
```
window.cacheCart.disposeLinks(document.body);
```

#### TODO:

* Decrement inventory when adding to cart
* Better show/hide solution
