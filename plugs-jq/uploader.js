;(function($){
	var Template = {
		uploader: '<div class="uploader">'
					+'<input type="hidden" />'
                    +'<div class="pgs big active greenIt"><div class="bar"></div></div>'
                    +'<div class="tit">请选择文件</div>'
                    +'<ul class="handle">'
                    +'	<li><i class="ico_16_white i118"></i></li>'
                    +'</ul>'
                  +'</div>'
              +'</div>',
        imgBox: '<div class="imgBox jpg"><div class="hvc"></div></div>',
        atom: '<input type="file" multiple>'
	};

	var ICON_stop = 'i74'
	,ICON_warn = 'i74'
	,ICON_plus = 'i118'
	,ICON_play = 'i102'
	,ICON_reload = 'i20'
	,ICON_ok = 'i73'
	;

	var DEFAULT_URL = '';

	/**
	 * [getAttrs 获得所有dom自定义属性]
	 * @param  {[type]} dom [dom标签]
	 * @return {[type]}     [自定义属性对象eg: {val:123,gid:342,text:'helloworld'}]
	 */
	var FILTER_ATTRS_ARRAY = ['required','width', 'disabled', 'name', 'attr', 'search', 'id']; 
	var getAttrs = function(dom){
		var o = {};
		if(!dom){
			o = null;
		}
		if(dom.attributes){
			
			for(var i=0, len = dom.attributes.length; i<len; i++){
				var key = dom.attributes[i].nodeName;
				if($.inArray(key, FILTER_ATTRS_ARRAY) > -1) continue;
				o[key] = dom.attributes[i].nodeValue;
			}
		}
		return o;
	};

	var Error = function(context, errorMessage){
		errorMessage = errorMessage || '';
		context.$pgr.removeClass('greenIt').addClass('redIt');
		context.$bar.css('width', '100%');
		context.$file.val('');
		context.$handle.html('<li><i class="ico_16_white '+ ICON_warn +'"></i></li>');
		context.status = 3;
		context.$el.trigger('uploader.error', errorMessage);
	}

	function Uploader(_this, opts){
		this.opts = opts;
		this.$el = $(_this);
		this.$file = null; //file 表单
		this.$binder = null //
		this.$filePath = null; //显示已选择文件的名称或者路径
		this.$plusBtn = null;
		this.$handle = null;
		this.$btn = null;	//操作按钮，(上传，停止，出错...)
		this.$pgr = null;	//进度条
		this.$imgBox = null; //图片框
		this.$imgContainer = null;
		this.$img = null;

		this.status = 0;//0:未选择，1：已选择，2：上传中,3:上传出错，4：上传完毕
		this.files = null; //选择加载的文件
		this.uploadQueue = null; //上传队列
		this.totalSize = 0;		//所有文件大小
		this.isCallFunc = false; //所有文件传完后有是否已经调用回调
		this.init();
	};
	Uploader.prototype = {
		init: function () {
			var self = this, opts = self.opts;
			var name, src, imgW, imgH;

			if(self.$el[0].tagName === 'INPUT' && self.$el[0].type === "file"){
				opts.multiple = self.$el.prop('multiple');//是否多选
				opts.value = self.$el.data('value');//默认值
				opts.url = self.$el.data('url');//服务器地址
				opts.filter = eval('('+self.$el.data('filter')+')');
				opts.autoUpload = self.$el.data('auto-upload');
				opts.
				imgW = self.$el.data('img-width');
				imgH = self.$el.data('img-height');
				if(imgW) opts.imgWidth = imgW;
				if(imgH) opts.imgHeight = imgH;
				if(imgW || imgH || self.$el.data('img')){
					opts.img = true;
				}
				opts.src = self.$el.data('src');//用于显示图片用的地址eg:http:/img1.qpdiy.com/.xxx.jpg
				if(opts.img){
					 opts.fileType = 'image';
				}
				self._view();
			}
			//如果参数中没有url则从dom中继续寻找
			if(!opts.url){
				if(!DEFAULT_URL){
					console.log('没有上传地址');
				}else{
					opts.url = DEFAULT_URL;
				}
			}
			
			//self.$file = self.$el.find('input[type=file]');
			self.$binder = self.$el.find('input[type=hidden]');
			if(opts.value) self.$binder.val(opts.value);
			name = self.$file.attr('name');
			if(name) {
				self.$binder.attr('name', name);
				self.$file.removeAttr('name');
			};
			
			self.$filePath = self.$el.find('div.tit');
			self.$pgr = self.$el.find('div.pgs');
			self.$bar =  self.$pgr.find('div.bar');
			self.$handle = self.$el.find('ul.handle');
			self.$btn = self.$handle.find('li > i');
			if(opts.img){
				self.$imgContainer = self.$imgBox.find('.hvc');
				opts.src = opts.value;
				opts.value && self.$imgContainer.html('<img src="'+ opts.src +'" />');
				//创建临时存放图片获取宽高DIV
				$domCache = $('.domCache');
				if(!$domCache.length){
					$('body').append($domCache = $('<div class="domCache" style="position: absolute;top: 0;left: 0;width: 0;height: 0;visibility: hidden;"></div>'));
				}
				self.$domCache = $domCache;
			}
			
			self.$pgr.hide();
			self.bindEvent();
		},
		_view: function (){
			var self = this;
			var $tmpl = $(Template.uploader);
			self.$file = self.$el;
			self.$el.before($tmpl);
			self.$el = $tmpl;
			self.$file.prependTo($tmpl);
			 self.$imgBox = $(Template.imgBox);
			if(self.opts.filter && $.isArray(self.opts.filter) && self.opts.filter.length){
				self.$imgBox.removeClass('jpg').addClass(self.opts.filter[self.opts.filter.length-1]);
			}
			if(self.opts.img) $tmpl.before(self.$imgBox);
			self.$el.attr(getAttrs(self.$file[0]));
			if(self.$file.prop('required')) self.$el.addClass('need');
			self.$el.addClass('uploader');
		},
		bindEvent: function () {
			var self = this;
			var opts = self.opts;
			var cb = opts.callback;

			//选择，上传，中止等文件操作
			self.$handle.delegate('li > i','click',function(e){
				if($(this).hasClass(ICON_plus)){//选择文件
					self.$file.click();
				}else if($(this).hasClass(ICON_play)){//上传文件
					self._upload();
				}else if($(this).hasClass(ICON_stop)){//中止上传文件
					self._cancel();
				}else if($(this).hasClass(ICON_warn)){//上传文件出错后重新选择文件
					self._reload();
				}else if($(this).hasClass(ICON_reload)){//上传完成后重新选择
					self.reset();
				}
				e.stopPropagation();
			});
			self.$el.click(function(){
				if(self.$handle.find('.'+ICON_plus).length){
					self.$file.click();
				}
			});
			self.$file.click(function(e){
				//防止死循环
				e.stopPropagation();
			});
			
			self.$file.change(function (e){
				if(e.target.files.length <=0){//用户点击了取消或者关闭按钮
					//由于用户打开文件选择框而点击取消按钮未选择任何文件，则会将原先的文件句柄都清除，所以得重置UI
					self.reset();			
					return false;
				} 
				self.totalLoaded = 0;
				self.files = e.target.files;


				if(!self.validate()){
					return false;
				}

				//self.totalSize = self.totalSize / 1024 / 1024;
				self.addFiles(e);
					
				if($.isFunction(cb)){
					cb(this.value);
				}
				
				
				//改变选择项的状态
				//self.$btn.filter('.'+ICON_plus).removeClass(ICON_plus).addClass(ICON_play);
				self.$bar.width(0).removeClass('redIt').addClass('greenIt');
				self.$handle.empty();
				self.$handle.html('<li><i class="ico_16_white '+ICON_plus+'"></i></li><li><i class="ico_16_white '+ICON_play+'"></i></li>');
				self.$pgr.show();
				
				
			});

			//绑定表单reset事件
			var $form = self.$el.closest('form');
			if($form.length){
				$form.on('reset.form','[type=reset]', function(){
					self.reset();
				});
			}
		},
		uploadAction: function(){
			var self = this;
			var $i = self.$btn.filter('.'+ICON_play).removeClass(ICON_play).addClass(ICON_stop);
			self.$handle.find('.'+ICON_plus).parent().remove();
		},
		addFiles: function(e,_input) {
			var self = this;
			var opts = self.opts;

			self.$filePath.html('');
			self.uploadQueue = [];
			
			switch(opts.fileType){
				case 'file':
					for(var i = 0, len = e.target.files.length; i < len; i++){
						var f = e.target.files[i];
						var name = f.name;
						var s = '';
						if(opts.autoUpload){
							self.$filePath.addClass('white');
							self.xhrSend(f); //直接发送文件至服务器
						}
						(i + 1 < len) ? s = ',' : s = ''; 
						self.$filePath.append(name + s);
					}
					break;
				case 'image':
					for(var i = 0, len = e.target.files.length; i < len; i++){
						var f = e.target.files[i];
						var name = f.name;
						var s = '';

						// var reader = new FileReader();
						// reader.readAsDataURL(e.target.files[i]); // 创建的url数据过大优化为以下方案
						// reader.onload = self.readerOnload(f);
						(i + 1 < len) ? s = ',' : s = ''; 
						self.$filePath.append(name + s);
						self.displayImg(f);
					}
					
					break;
				case 'text':
					reader.readAsText(e.target.files[0]);
				case 'buffer':
					reader.readAsArrayBuffer(e.target.files[0]);
					break;
			}
			self.status = 1;
			self.$el.trigger('uploader.selected');
		},
		validate: function(value){
			var self = this;
			var opts = self.opts;
			if(self.files.length<=0){
				return false;
			}
			
			if(!!opts.max && self.files.length > opts.max){
				alert('选择文件不能大于' + opts.max);
				return false;
			}
			self.totalSize = 0;
			for(var i=0; i<self.files.length; i++){
				if(!!self.opts.dangerFiles && self.isDangerous(self.files[i].name, self.opts.dangerFiles)){
					alert('上传的文件格式不符合安全要求');
					return false;
				}
				
				if(!!self.opts.filter && !self.isDangerous(self.files[i].name, self.opts.filter)){
					alert('上传的文件格式不符合要求');
					return false;
				}
				
				if(self.files[i].size > opts.maxSize){
					alert('选择的文件中有文件大于' + opts.maxSize / 1024 / 1024 + 'MB');
					return false;
				}
				self.totalSize += self.files[i].size;
				if(self.totalSize > opts.totalMaxSize){
					alert('文件总数大于' + opts.totalMaxSize / 1024 / 1024 + 'MB');
					return false;
				}
			}

			return true;
		},
		isDangerous: function (value, arr){
			var self = this;
			var value = value.toLowerCase().substring(value.lastIndexOf('.') + 1);
			if($.inArray(value, arr) > -1){
				return true
			}
			return false;
		},
		displayImg: function(file){
			var url = window.URL.createObjectURL(file);
			var self = this;
			var opts = self.opts;
			var $img = $('<img src="'+ url +'" />');
			self.$domCache.append($img);

			$img[0].onload = function(){
				var _w,_h;
				if(opts.imgWidth){
					_w = $img[0].width;
					if(_w > opts.imgWidth){
						alert('图片最宽不能超过' + opts.imgWidth);
						self.reset();
						return ;
					}
				}
				if(opts.imgHeight){
					_h = $img[0].height;
					if(_h > opts.imgHeight){
						alert('图片最高不能超过' + opts.imgHeight);
						self.reset();
						return ;
					}
				}
				self.$imgContainer.html($img);
				if(opts.autoUpload){
					self.$filePath.addClass('white');
					self.xhrSend(file);//做为reader onload回调
					self.uploadAction();
				}
				self.$el.trigger('uploader.fileLoaded',file);
				window.URL.revokeObjectURL(this.src);
			}
		},
		readerOnload: function(file) { // deprecated
			var self = this;
			var opts = self.opts;
			return (function(e){
				var $img = $('<img src="'+ e.target.result +'" />');
				self.$domCache.append($img);

				$img[0].onload = function(){
					var _w,_h;
					if(opts.imgWidth){
						_w = $img[0].width;
						if(_w > opts.imgWidth){
							alert('图片最宽不能超过' + opts.imgWidth);
							self.reset();
							return ;
						}
					}
					if(opts.imgHeight){
						_h = $img[0].height;
						if(_h > opts.imgHeight){
							alert('图片最高不能超过' + opts.imgHeight);
							self.reset();
							return ;
						}
					}
					self.$imgContainer.html($img);
					if(opts.autoUpload){
						self.$filePath.addClass('white');
						self.xhrSend(file);//做为reader onload回调
						self.uploadAction();
					}
					self.$el.trigger('uploader.fileLoaded',file);
				}
			});
		},
		xhrSend: function(file) {
			var self = this;
			var opts = self.opts;
				var fd = new FormData();
				fd.append("name", file.name);
				fd.append("file", file, file.name);

				try{/// for yp framework
					fd.append("pre", window.APP_FUNCTION_AREA_BTNS.curApp, true);
				}catch(e){}
				
				var xhr = function() {
					var _xhr = jQuery.ajaxSettings.xhr();
					//_xhr.upload.addEventListener('loadstart', self.uploadstart(xhr) , false);
					_xhr.upload.addEventListener('progress', self.uploading(xhr) , false);
					//_xhr.upload.addEventListener('load', self.uploaded(xhr), false);
					//_xhr.upload.addEventListener('loadend', self.uploadend(xhr), false);
					return _xhr;
				};
				
				xhr._file = file;
				self.uploadQueue.push({xhr: xhr, fd: fd});
				$.ajax({
				   url: opts.url,
				   dataType: 'json',
				   type: "POST",
				   data: fd,
				   processData: false,
				   contentType: false,
				   xhr: xhr,
				   success: function(response) {
					   if(!self.isCallFunc && $.isFunction(self.opts.oncomplete)){
							self.isCallFunc = true; 
							self.opts.oncomplete(response);
					   }
					   //console.log(response['status']);
					   if(response.code == 0){
					   		if(response.data && response.data.url){
								self.$binder.val(response.data.url);
							}else{
								self.$binder.val('');
							}
					   }else{
							self.$pgr.removeClass('greenIt').addClass('redIt');
							self.$bar.css('width', '100%');
							//console.log(self.$btn.filter('.ICON_stop')[0]);
							self.$handle.find('.'+ICON_stop).removeClass(ICON_stop).addClass(ICON_warn);
							self.status = 3;
							self.$el.trigger('uploader.error');
					   }
					   self.xhrLoaded.call(this.xhr,self);//校正上传的文字大小
				   },
				   error: function(jqXHR, textStatus, errorMessage) {
					   //通信出错
					   Error(self, errorMessage);
				   },
				   complete: function(response){
				   		var r;
				   		if(response.responseText){
				   			r = JSON.parse(response.responseText);
				   			if(r.code != 0){
				   				Error(self);
				   			}
				   		}
				   }
				});
		},
		uploadstart:  function (xhr){
			var self = this;
			return (function(e){
				console.log(e,'start');
				if (e.lengthComputable) {
					
				}
			});
		},
		uploading: function (xhr){
			var self = this;
			return (function(e){
				if (e.lengthComputable) {
					//console.log('net file current loaded: => ' + e.loaded);
					var percentage = (e.loaded * 100) / e.total;
					xhr._loaded = e.loaded;
					self.updatePercent();
					self.status = 2;
				}
			});
			
		},
		uploaded: function(xhr){
			var self = this;
			return (function(e){
				if (e.lengthComputable) {
					self.updatePercent();
				}
			});
		},
		uploadend: function(){
			//上传完毕，fail or success
		},
		xhrLoaded: function (self) {
			this._loaded = this._file.size;
			this._loadend = true;
			self.updatePercent();
		},
		updatePercent: function(){
			var self = this;
			var tempPer = 0;
				var num = len = self.uploadQueue.length
				for(var i=0, len; i<len; i++){
					if(self.uploadQueue[i].xhr._loaded){
						tempPer += self.uploadQueue[i].xhr._loaded;
						if(self.uploadQueue[i].xhr._loadend){
							num--;
						}
					}
				}
				
				var r = Math.round((tempPer / self.totalSize) * 100);

				self.$el.trigger('uploader.uploading', r);

				self.$bar.css('width', r + '%');
				///to do
				if(r >= 100 && num===0){//所有文件上传完毕
					if(!self.$pgr.hasClass('redIt')){//如果进度条不为红色
						self.$pgr.addClass('greenIt');
						self.$pgr.removeClass('active');
						self.$handle.html('<li><i class="ico_16_white '+ICON_reload+'"></i></li><li><i class="ico_16_white '+ICON_ok+'"></i></li>');
						//延时触发完成事件
						//setTimeout(function(){
							self.$el.trigger('uploader.uploadSuccess');
						//},3000);
						self.status = 4;
					}else{
						self.$el.trigger('uploader.uploadFail');
						self.status = 3;
					}
				}
			
		},
		reset: function(){
			this.$btn.filter('.'+ICON_play).parent().remove();
			this.$btn.filter('.'+ICON_ok).parent().remove();
			this.$handle.html('<li><i class="ico_16_white '+ ICON_plus +'"></i></li>');
			this.$btn = this.$handle.find('li > i');
			this.$pgr.removeClass('redIt').addClass('greenIt').hide();
			this.$bar.css('width', '0%');
			this.$filePath.removeClass('white').html('请选择文件');
			this.$binder.val('');
			this.$file.val('');
			this.status = 0;
			if(this.$imgContainer){
				this.$imgContainer.html('');
			}
		},
		_reload: function(){
			var self = this;
			self.$handle.html('<li><i class="ico_16_white '+ICON_plus+'"></i></li>');
			self.$pgr.removeClass('redIt').addClass('greenIt').hide();
			self.$bar.css('width', '0%');
			self.$filePath.removeClass('white').html('请选择文件');
			if(self.$imgContainer){
				self.$imgContainer.html('');
			}
		},
		_cancel: function() {
			var self = this;
			self._reload();

			if(self.uploadQueue.length > 0){
				for(var i=0; i< self.uploadQueue.length; i++ ){
					if(self.uploadQueue[i].xhr){
						self.uploadQueue[i].xhr.abort && self.uploadQueue[i].xhr.abort();	
					}
				}
				self.uploadQueue.length = 0;
			}

			this.status = 0;
			if(self.$imgContainer){
				self.$imgContainer.html('');
			}
		},
		_upload: function(){
			this.$filePath.addClass('white');
			this.$handle.empty();
			for(var i=0; i<this.files.length; i++){
				this.xhrSend(this.files[i]);
			}
			this.uploadAction();
		},
		getVal: function(){
			return this.$binder.val();
		},
		hasUploaded: function(){
			if(!!this.status === 4){
				return true;
			}
			return false;
		},
		cancel: function(){
			this._cancel();
		},
		upload: function(){
			//console.log(this.status);
			//已选择文件则上传
			if(this.status === 1){
				this._upload();
			}
			return this;
		}
	};
	
	$.fn.uploader = function(opt){
		var ret = [];
		this.each(function() {
			var handle = $(this).data("upload_handle");
			if(!handle){
				handle = new Uploader($(this), $.extend(true, {}, $.fn.uploader.defaults, opt));
				$(this).data("upload_handle", handle);
			}
			ret.push(handle);
		});

		return ret.length===1 ? ret[0] : ret;
	};
	$.fn.uploader.data = function(){
		if(!arguments.length) return ;
		if(arguments[0] === 'defaultUrl' && arguments[1].constructor === String){
			DEFAULT_URL = arguments[1];
		}
	};
	$.fn.uploader.defaults = {
		callback: null,		//文件选择后调用
		autoUpload: false,	//选择后自动上传
		url: null,			//文件上传地址
		oncomplete: '', 	//上传完毕回调函数名称
		fileType: 'file',	//text,image,file 
		filter:null,		//传入一个数组以示只能上传哪些格式eg:['zip','jpg','gif','png']
		dangerFiles:['exe','bat'],		//过滤不安全文件,不需要过滤请传入空数组[]
		multiple: true,
		max: 20,
		maxSize: 104857600,	//单个文件总大小100MB
		//是否需要构造HTML结构
		structure: false,
		//生成的hidden input name名称
		name:'',
		//文件总大小50MB
		totalMaxSize: 524288000,
		//img标签对象
		imgs:null,
		imgWidth:null,
		imgHeight:null,
		//默认值,用于表单设置默认路径
		value: ''
	};
})(jQuery);