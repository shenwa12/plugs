(function(win){
	var APP_RELEASE = APP_RELEASE || 0;//资源版本控制
	var sourceLoader = function(source,cb, styleType){
		this.index = -1;
		this.totalSize = 0;
		this.loadedSize = 0;
		this.styleType = (!!styleType) ?  styleType='publicStyle' : styleType='privateStyle';
		this.source = [];
		this.addSource(source);
		this.eventMap = {};
		this.callback = cb;
	}
	sourceLoader.prototype.addSource = function (source){
		if(!source) return;
		source = (source instanceof Array)? source: [source];
		for(var i=0;i <source.length; i++){
			this.totalSize += source[i].size || 0;
			this.index++;
		}
		this.source = this.source.concat(source);
		this.load();
	}
	sourceLoader.prototype.load = function (source){
		this.loadNext();
	}
	sourceLoader.prototype.loadNext = function (){
		var self = this;

		if(self.index > -1){
			var img = new Image();
			img.src = self.source[self.index].src;
			self.loadedSize += self.source[self.index].size || 0;
			
			img.onload = function(e){
				var per = 0;
				if(self.totalSize > 0){
					per = Math.round((self.loadedSize/self.totalSize) * 100)
				}
				if(self.eventMap['loaded']){
					self.eventMap['loaded'].call(self,{
						currentTarget:img,
						perLoaded:per
					});
				}
				if(self.index <= 0){
					//全部加载完毕
					if(self.eventMap['complete']){
						self.eventMap['complete'].apply(self);
					}
					self.renderImage();
					if(self.callback instanceof Function){
						self.callback(img);
					}
				}
				self.index--;
				self.loadNext();
			}
		}
	}
	/*允许侦听两种类型的事件*/
	sourceLoader.prototype.addEventListener = function(type,handler){
		var self = this;
		if(type.constructor !== String || handler.constructor !== Function) return;
		if(type === 'loaded' || type === 'complete'){
			self.eventMap[type] = handler;
		}
	}
	
	/*将图片渲染到网页上*/
	sourceLoader.prototype.renderImage = function(){
		var style = document.getElementById(this.styleType);
		var css_str = '';
		for(var i = 0,len = this.source.length; i < len; i++){
			if(!this.source[i].id) continue;
			if(!!this.source[i].dom === true){
				var target = document.getElementById(this.source[i].id);
				if(target) target.src = this.source[i].src;
			}else{
				css_str += this.source[i].id + '{background-image:url("'+ this.source[i].src+'")}';
				
			}
		}
		style.innerHTML += css_str;
		
		//reset self
		this.index = -1;
		this.totalSize = 0;
		this.loadedSize = 0;
		this.source = [];
		this.eventMap = {};
	}
	/*数组去重*/
	var uniq = function(a) { 
		var toObject = function(a) { 
			var o = {}; 
			for (var i=0, j=a.length; i<j; i=i+1) { 
				o[a[i]] = true; 
			} 
			return o; 
		}; 
		var keys = function(o) { 
			var a=[], i; 
			for (i in o) { 
				if (o.hasOwnProperty(i)) {
					a.push(i); 
				} 
			} 
			return a; 
		}; 
		return keys(toObject(a)); 
	}; 
	if(win.imgLoader === undefined){
		win.imgLoader = {};
	}
	/*实现game框架接口*/
	win.imgLoader.init = function (){};
	win.imgLoader.load = function (data,cb,styleType){
		return new sourceLoader(data,cb,styleType);
	};
	/*
	win.imgLoader.preload = function (a,cb,styleType){
		var arr = [];
		for(var i=0,len=a.length; i<len; i++){
			arr.push({src:'statics/ui/plant/' +a[i] + '.png', id:'.id_' + a[i]});
		}
		imgLoader.load(arr, cb, styleType);
	}
	*/
})(window);