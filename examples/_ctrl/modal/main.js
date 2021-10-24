self.addEventListener(inc_mount_on_this_file, function(evt) {
	self.modalTpl = evt.detail.$body.querySelector("template");
});

const modals = [];

class Modal {
	constructor(name) {
		if (!self.modalTpl) {
			throw new Error("Modal template is'n found.");
		}
		this.name = name;
		this.$body = self.modalTpl.content.firstElementChild.cloneNode(true);
		this.$cnt = this.$body.querySelector(".modal-body");
		this.$body.onclick = (evt) => {
			if (evt.target == this.$body) {
				this.close();
			} else {
				evt.cancelBubble = true;
			}
		}
	}
	show(props) {
		if (this.$body.parentNode) {
			return;
		}
		modals.push(self.curWin = this);

		if (!props) {
			return this._show();
		}
		if (props.className) {
			this.$body.classList.add(props.className);
		}
		if (props.url) {
			return fetch(props.url, props)
				.then(res => {
					if (res.ok) {
						return res.text();
					}
					throw new Error(`>>>Modal show by url isn't ok. Request ${props.url} stat ${res.status}`);
				})
				.then(text => this._show(props, text));
		}
		return this._show(props, props.text);
	}
	_show(props, text) {
		document.body.appendChild(this.$body);
		this.$body.classList.add("show");
		if (text) {
			this.$cnt.innerHTML = text;
			if (self.tpl) {
				if (self.getLineNo) {
					self.getLineNo.mark(self.getLineNo.type_markCtx(props.url, text), {
						children: this.$cnt.children
					});
				}
				if (props.url) {
					(self.tpl.get$srcDescr(this.$body) || self.tpl.createTagDescr(this.$body)).top_url = props.url;
				}
				this.data = self.tpl.getProxy(props ? props.data : {});
//				const scope = {};
//				for (const i in this.data) {
//					scope[i] = this.data[i];
//				}
//console.log(222222, this.data);
				return self.tpl
					.go(this.$body, undefined, this.data)
					.then(() => this);
			}
		}
		return Promise.resolve(this);
	}
	close() {
		if (!this.$body.parentNode) {
			return;
		}
		modals.pop();
		self.curWin = modals[0];
		(self.tpl || document.body).removeChild(this.$body);
		this.$body.classList.remove("show");
		return this;
	}
}
self.Modal = Modal;
