;(function($){
	function Validator(_this, opts){
		this.opts = opts;
		this.items = [];
		this.requires_ary = [];
		this.errors = [];
		this.callback = opts.callback;
		this.$form = $(_this);
		this.init();
	};
	
	Validator.prototype.init = function (){
		var self = this;
		
		//表单元素注册表单验证
		self.$form.find('input,select,textarea').each(function(){
			var r = $(this).attr('rules');
			if(!!r){
				if(self.opts.focusoutVerify){
					if($(this).attr('type') === 'checkbox' || $(this).attr('type') === 'radio' && !!r){//checkbox需要特殊处理(一组checkbox只有一个rules属性)
						var rules = Validator.parseJSON(r);
						self.$form.find('input[name=' + $(this).attr('name') + ']').each(function(){
							$(this).click(function(){
								//console.log(this.type);
								self.clearMsg(this);
								self.verify(this,rules);
							});
						});
					}else{
						$(this).focusout(function(){
							self.verify(this,Validator.parseJSON(r));
						}).focusin(function(){
							self.clearMsg(this);
						});
					}
				}else{
					self.registerRules(this,Validator.parseJSON($(this).attr('rules')));
					// $(this).focusin(function(){
							// self.clearMsg(this);
					// });
				 }
				
				//实时校验
				var rulesJSON = Validator.parseJSON(r)['filter'];
				if(!!rulesJSON){
					self.filterTypping(this,rulesJSON);
				}
			}
		});
		
		
		self.$form.find('[type=submit]').click(function(){
			self.clearMsg(this);
			self.verify();
			if(self.errors.length > 0){
				return false;
			}
		});
	};
	
	Validator.prototype.registerRules = function(obj,rules){
		this.items.push([obj,rules]);
	};
	
	Validator.prototype.verify = function (obj,rules){
		var self = this;
		//self.errors.length = 0;
		
		if(!!!obj && !!!rules){//submit 验证
			for(var i=0; i<this.items.length; i++){
				for(var j in this.items[i][1]){
					if(!self.check(this.items[i][0],j,this.items[i][1][j])){
						break ;//顺序验证其中一个出错就结束验证
					}
				}
			}
		}else{//focusout 验证
			for(var i in rules){
				if(!self.check(obj,i,rules[i])){
					break ;//顺序验证其中一个出错就结束验证
				}
			}
		}
		self.callback(self.errors,self.$form);
		self.errors.length = 0;
	};
	
	/*检查规则*/
	Validator.prototype.check = function(obj,rules,rulesValue){
		var self = this;
		
		switch(rules){
			case 'require':
				self.requires_ary.push(obj);
				return self.require(obj);
				break;
			case 'equalTo':
				return self.equalTo(obj,rulesValue);
				break;
			case 'minlength':
				return self.minlength(obj,rulesValue);
				break;
			case 'maxlength':  
				return self.maxlength(obj,rulesValue);
				break;
			case 'type':
				return self.checkForType(obj,rulesValue)
				break;
			case 'ajax':
				return self.ajaxVerify(obj,rulesValue);
				break;
		}
	};
	/*根据type值进行相应的正则检验*/
	Validator.prototype.checkForType = function(obj,rulesValue){
		var self = this;
		switch(rulesValue){
			case 'number':
				return self.isNumber(obj);
				break;
			case 'digits':
				return self.isDigits(obj);
				break;
			case 'url':
				return self.isURL(obj);
				break;
			case 'mail':
				return self.isMail(obj);
				break;
			case 'date':
				return self.isDate(obj);
				break;
			case 'regexp':
				//直接获得regex属性值即为自定义正则表达式
				return self.isRegexp(obj);
				break;
		}
	};
	
	Validator.prototype.isRequire = function(obj){
		for(var i=0; i< this.requires_ary.length; i++){
			if(obj == this.requires_ary[i]){
				return true;
			}
		}
		return false;
	};
	
	Validator.prototype.require = function(obj){
		var self = this;
		var $obj = $(obj)
		var radioHasChecked = false;
		
		if($obj.attr('type') === 'checkbox'){//处理checkbox
			if(self.countCheckbox($obj) < 1){
				self.addMsg([obj,Validator.messages.require]);
				return false;
			}
			return true;
		}
		
		if($obj.attr('type') === 'radio'){//处理radio
			self.$form.find('input:radio[name='+ $obj.attr('name') +']').each(function(){
				if($(this).attr('checked')){
					radioHasChecked = true;
				}
			});
			if(!radioHasChecked){
				self.addMsg([obj,Validator.messages.require]);
				//console.log($(obj)[0].tagName +' radio ' + Validator.messages.require);
			}
			return radioHasChecked;
		}
		if($.trim($(obj).val()) == ''){
			self.addMsg([obj,Validator.messages.require]);
			//console.log(obj + Validator.messages.require);
			return false;
		}
		return true;
	};
	
	Validator.prototype.equalTo = function(obj,target){
		var self = this;
		if($.trim($(obj).val()) !== $.trim($('#'+target).val())){
			self.addMsg([obj,Validator.messages.equalTo]);
			//console.log(obj + Validator.messages.equalTo);
			return false;
		}
		return true;
	};
	
	Validator.prototype.isNumber = function(obj){
		var self = this;
		return self.regexCheck(obj,Validator.regexs.number,Validator.messages.number);
	};
	
	Validator.prototype.isDigits = function(obj){
		var self = this;
		return self.regexCheck(obj,Validator.regexs.digits,Validator.messages.digits);
	};
	
	Validator.prototype.isURL = function(obj){
		var self = this;
		return self.regexCheck(obj,Validator.regexs.url,Validator.messages.url);
	};
	Validator.prototype.isMail = function(obj){
		var self = this;
		return self.regexCheck(obj,Validator.regexs.mail,Validator.messages.mail);
	};
	Validator.prototype.isDate = function(obj){
		var self = this;
		var val = $.trim($(obj).val());
		if(val !== ''){
			if(!(!/Invalid|NaN/.test(new Date(val)))){
				//console.log(obj + Validator.messages.date);
				self.addMsg([obj,Validator.messages.date]);
				return false;
			}
		}
		return true;
	};
	/*自定义正则表达式校验*/
	Validator.prototype.isRegexp = function (obj){
		var self = this;
		var r = new RegExp($(obj).attr('regexp'),'g');
		return self.regexCheck(obj, r , Validator.messages.regexp);
	};
	
	Validator.prototype.minlength = function(obj,target){
		var self = this;
		var $obj = $(obj);
		
		if(!self.isRequire(obj) && $.trim($obj.val()) === ''){//非必填且值为空
			return false;
		}
		
		if($obj.attr('type') === 'checkbox'){//处理checkbox
			if(self.countCheckbox($obj) < target){
				self.addMsg([obj,Validator.messages.minlength]);
				return false;
			}
			return true;
		}
		
		if($.trim($(obj).val()).length < parseInt(target)){
			self.addMsg([obj,Validator.messages.minlength]);
			//console.log(obj + Validator.messages.minlength);
			return false;
		}
		return true;
	};
	Validator.prototype.maxlength = function(obj,target){
		var self = this;
		var $obj = $(obj);
		
		if(!self.isRequire(obj) && $.trim($obj.val()) === ''){//非必填且值为空
			return false;
		}
		
		if($obj.attr('type') === 'checkbox'){//处理checkbox
			
			if(self.countCheckbox($obj) > target){
				self.addMsg([obj,Validator.messages.maxlength]);
				return false;
			}
			return true;
		}
		if($.trim($(obj).val()).length > parseInt(target)){
			self.addMsg([obj,Validator.messages.maxlength]);
			//console.log(obj + Validator.messages.maxlength);
			return false;
		}
		return true;
	};
	
	Validator.prototype.ajaxVerify = function (obj,_url){
		var self = this;
		var $o = $(obj);
		var val = $.trim($o.val());
		var name = $o.attr('name');
		if(val !== ''){
			$.ajax({
				type:"post",
				dataType:"json",
				url:_url,
				data:{type:name ,value: val},
				success:function(data){
					var error = $o.attr('error');
					(!!error) ? error : error =  Validator.messages.ajax ; 
					if(data.result){
						return true;
					}else{
						self.addMsg([obj,error]);
						self.callback(self.errors);
						return false;
					}
				},
				error: function(){
					return false;	
				}
			});
		}
		return true
	};
	
	Validator.prototype.countCheckbox = function($obj){
		var checked = 0;
		this.$form.find('input:checkbox[name='+ $obj.attr('name') +']').each(function(){
			if($(this).attr('checked')){
				checked++;
			}
		});
		//console.log(checked);
		return checked;
	};
	
	Validator.prototype.regexCheck = function(obj,reg,message){
		var self = this;
		var val = $.trim($(obj).val());
		if(self.isRequire(obj) || (!self.isRequire(obj) && val !== '')){//必填 或  (选填且值不为空)
			if(!!!reg.test(val)){
				if(!!!Validator.parseJSON($(obj).attr('rules'))['filter'])//如果是实时校验就不提示验证信息
				self.addMsg([obj,message]);
				return false;
			}
		}
		return true;
	};
	/*实时校验并禁止输入不符合规则的字符*/
	Validator.prototype.filterTypping = function(obj,filterType){
		var self = this;
		var $obj = $(obj);
		//var $debug = $('#debugInput');
		var lastValue = $.trim($obj.val());
		//$obj.unbind('input propertychange').bind('input propertychange',function(e){
		$obj.bind('input propertychange',function(e){
			
			if(!self.checkForType(obj,filterType) && $obj.val() !== ''){//当前值校验如果不符合，则恢复为上一次的值
				$obj.val(lastValue);
			}
			lastValue = $(this).val();
		});
	};
	/*添加错误信息*/
	Validator.prototype.addMsg = function(error){
		if(Validator.inArray(error, this.errors) === -1) this.errors.push(error);
	};
	/*删除错误信息*/
	Validator.prototype.clearMsg = function(obj){
		var arr = this.errors;
		if (obj.type === 'checkbox' || obj.type === 'radio'){//清除所有相同name值的checkbox 或 radio 错误消息
			for(var i=0; i < arr.length ; i++){
				if(arr[i][0].name == obj.name){
					arr = arr.splice(i,1);
				}
			}
		}else{//清除表单项对应的错误信息
			for(var i=0; i < arr.length ; i++){
				if(obj ==  arr[i][0]){
					arr = arr.splice(i,1);
				}
			}
		}
		//console.log(this.errors);
	};
	/*显示错误的表单项提示信息*/
	Validator.prototype.showMessage = function (messages){
		/*
		$(document.body).find('.error').remove();
		for(var i=0; i<messages.length; i++){
			var $obj = $(messages[i][0]);
			var pos = {x:$obj.offset().left,y:$obj.offset().top};
			var $dom = $('<div id="'+ $obj.attr('id') +'error" class="error">' + messages[i][1] + '</div>');
			var error = $(document.body).append($dom);
			$dom.css({left:pos.x,top:pos.y + $obj.outerHeight(true)});
			$obj.bind('focusin',function(){//鼠标再次聚焦时删除错误提示信息
				var tip = $('#'+this.id + "error").remove();
			});
		}
		*/
	};
	
	/*转换成json对象*/
	Validator.parseJSON = function (str){
		return (new Function("","return "+str))();
	};
	Validator.inArray = function(obj1, arr){
		for(var i=0; i < arr.length; i++){
			if(obj1[0] ==  arr[i][0]){//数组(二维数组)元素相等
				return i;
			}
		}
		return -1;
	};
	Validator.regexs = {//正则取自jquery.validator
		number: /^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/,
		digits: /^\d+$/,
		url: /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i,
		mail: /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i
	};
	Validator.messages = {
		require:'此项为必填项',
		equalTo:'两次输入不一致',
		number:'输入必须为数字',
		digits:'输入的值必须为整数',
		url:'URL地址错误',
		mail:'邮件地址错误',
		date:'日期格式错误',
		regexp:'输入的值不符合要求',
		minlength:'输入的值太小',
		maxlength:'输入的值太大',
		ajax:'服务器验证失败'
	};
	
	
	$.fn.validator = function(opt){
		var ret = [];
		this.each(function() {
			var handle = $(this).data("validator_handle");
			if(!handle){
				handle = new Validator($(this), $.extend(true, {}, $.fn.validator.defaults, opt));
				$(this).data("validator_handle", handle);
			}
			ret.push(handle);
		});

		return ret.length===1 ? ret[0] : ret;
	};
	$.fn.validator.defaults = {
		//默认表单
		callback: function(){},
		focusoutVerify: false
	};
})(jQuery);