import "../main.js";
import {getLoc} from "../../util.js";

self.data = {
	loc: getLoc(self.location.hash),
	bagData: null,
	curOrder: (sessionStorage.getItem("curOrder") || "").json()
};

self.onhashchange = function() {
	while (self.curWin && self.curWin.close());
	self.data.loc = getLoc(self.location.hash);
}
self.onbeforeunload = function() {
	if (!self.data.bag) {
		return;
	}
	sessionStorage.setItem("bag", JSON.stringify(self.data.bag));
}

self.getPageTitle = function() {
	return `${self.data.loc.name || "cat"} - shop - myweb/tpl`;
}

self.showProduct = function(productId) {
	if (self.Modal) {
		new self.Modal().show({url: 'shop/products/card.html', data: self.data.products[self.data.products.findIndex(p => p.id == productId)]});
	}
}
self.showOrder = function() {
	if (self.Modal) {
		new self.Modal("bagForm").show({url: "shop/bag/modal.html"});
	}
}
self.addBagProduct = function(productId, evt) {
	if (evt) {
		evt.cancelBubble = true;
	}
	if (self.data.bag.findIndex(p => p.id == productId) != -1) {
		return;
	}
	self.data.bag.push(self.data.products[self.data.products.findIndex(p => p.id == productId)]);
	self.lastBagOperation = "add";
	self.data.bagData = JSON.stringify(self.data.bag);
}
self.removeBagProduct = function(productId, evt) {
	if (evt) {
		evt.cancelBubble = true;
	}
	const idx = self.data.bag.findIndex(p => p.id == productId);
	if (idx == -1) {
		return;
	}
        self.data.bag.splice(idx, 1);
	self.lastBagOperation = "remove";
	self.data.bagData = JSON.stringify(self.data.bag);
}
self.onBag = function(bag) {
	console.info("Get bag REST was fake. Server sent:", bag);
//becouse "bag" is fake
	if (!(bag = self.data.bag)) {
		bag = [];
	}
	self.data.bag = bag;
	delete self.data.bagData;
	if (!self.lastBagOperation) {
		return;
	}
	if (self.data.bag.length) {
		if (self.lastBagOperation != "remove") {
			showOrder();
		}
	} else if (self.curWin && self.curWin.name == "bagForm") {
		self.curWin.close();
	}
	delete self.lastBagOperation;
}
self.onOrderSubmit = function(order) {
	console.info("Submit order REST was fake. Server sent:", order);
	delete self.data.orderData;
	self.data.bag = [];
	localStorage.setItem("curOrder", JSON.stringify(self.data.curOrder = order));
	self.location.hash = "/order/confirm";
}
