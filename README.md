# Cache Cart
A simple Javascript-powered PayPal shopping cart that doesn't require any back end code. Check out the [demo](http://cacheflowe.github.com/cache-cart/).
#### Instructions:
###### Import the css:
	<link href="./cache-cart.css" media="screen" rel="stylesheet" type="text/css" />
###### Import reqwest for the ajax call:
	<script src="./reqwest.min.js" type="text/javascript"></script>
###### Import the Cache Cart javascript:
	<script src="./cache-cart.js" type="text/javascript"></script>
###### Customize the products and configuration in **products.json**
* Change the `cart-title` to match your site
* Change the `paypal-email` to link to your PayPal merchant account

###### Load your product data JSON when the site is ready:
	window.cacheCart.init('./products.json');
###### Create links in your page that tell the cart to add a product:
	<a href="javascript:window.cacheCart.addItem('PSS002');">Buy Now</a>

#### TODO:

* Decrement inventory when adding to cart
  * Show SOLD OUT id inventory goes to zero
* Better show/hide solution
