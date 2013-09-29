;(function($){
	"use strict";
	/**
	 * UglySelect 插件
	 * ver:1.0
	 * 2013/3/5
	 * mailto: xiaodong1986@me.com
	 */

	/**
	 * [Template 组件html模板]
	 * @type {Object}
	 */
	var Template = {
		item: '<div class="checkerWrap"></div>'
		, checkbox: '<i class="checkbox"><input type="checkbox" name="uglySelect"></i>'
		, footer: '<div class="listCtrl">\
		            <div class="cancel"><i class="ico_16_color i24"></i></div>\
		            <div class="enter"><button type="button" class="btn basic">ok</button></div>\
		            <div class="all"><span class="badgeMini">0</span></div>\
		        </div>'
	}

	/**
	 * [Selector Selector类]
	 * @param {DOM} _this [触发对象]
	 * @param {Object} opts  [配置参数]
	 */
	function UglySelect(_this, opts){
		this.opts = opts;
		this.$el = $(_this);
		this.$select = null;//原生select表单
		
		this.init();
	}
	UglySelect.prototype = {
		init: function () {
			var self = this, defaults, defaultTexts, $items, multiText;
			self.dom = self.$el; //开放的DOM接口
			self.selector = self.$el.ypSelect(); // 先建立selector
			self.bindEvent();
			// 如果有默认项，则设置默认项
			defaults = self.$el.data('uglyselectval');
			if(defaults){
				$items = self.selector.dom.find('option');
				if(!$.isArray(defaults)){
					defaults = eval(defaults);///
				}
				defaultTexts = []
				defaults.forEach(function(v){
					$items.each(function(){
						var val, $this;
						$this = $(this);
						val = $this.val();
						if(val == v){
							defaultTexts.push($this.text());
						}
					});

				});
				if(defaultTexts.length > 1){
					multiText = defaultTexts[0]+'...';
				}else{
					multiText = defaultTexts[0]
				}
				self.selector.dom.find('.seltTit').text(multiText);
			}
		},
		/**
		 * [_renderView 添加下拉菜单子内容]
		 * @return {String}
		 */
		renderView: function(isSearchAction){
			var self = this
			, uglyMode = false
			, $drop
			, $footer = $(Template.footer)
			, hasFooter = false
			, $all = $footer.find('span')
			, $seltTit = self.selector.dom.find('.seltTit')
			, $items
			, $tmpLi
			, tmpVal
			, count = 0
			, len
			, defaults
			, defaultTexts
			, allFunc
			, cancelFunc
			, checkFunc
			, showMultiUI
			, multiText
			;
			
			$drop = self.selector.dropbox.$drop;
			$items = $drop.find('li');
			if(!isSearchAction && self.$el.find('option').length > $items.length){
				$tmpLi = $items.eq(0).clone();
				tmpVal = self.$el.val();
				$tmpLi.data('val', tmpVal).text(self.$el.find('option[value='+tmpVal+']').text());
				$drop.find('ul').append($tmpLi);
			}
			$items = $drop.find('li');
			len = $items.length;

			allFunc = function(bool){
				count =  bool ? len : 0;
				$items.find('input[type=checkbox]').each(function(){
					$(this).checkbox().setChecked(bool);
				});
				$all.text(count);
			};

			checkFunc = function(checkbox){
				if(checkbox.isChecked()){
					count++;
				}else{
					count--;
				}
				$all.text(count);
				
				// 发现无选中记录则退到单选功能状态
				if(count <=0){
					cancelFunc();
				}
			};

			showMultiUI = function(){
				$items.find('.checkerWrap').append(Template.checkbox);
				$items.find('input[type=checkbox]').each(function(){
					$(this).checkbox();
				})
				.click(function(e){
					e.stopPropagation();
				});
				$drop.on('change', function(e){
					var ck;
					if($(e.target).attr('type') === 'checkbox'){
						ck = $(e.target).checkbox()
						checkFunc(ck);
					}
					e.stopPropagation();
				});
				$items.find('.checkerWrap > .checkbox').show();
				$footer.css('display','');
				!hasFooter && $drop.append($footer);
				hasFooter = true;
			}

			cancelFunc = function(){
				var v;
				uglyMode = false;
				allFunc(false);
				$footer.hide();
				$items.find('.checkerWrap > .checkbox').hide();
				self.$el.data('uglyselectval', '');			
				$seltTit.text(self.$el.find('option[value='+self.$el.val()+']').text() || self.singleViewVal);
			}

			///
			$items.find('.checkerWrap').remove();
			$drop.find('.listCtrl').remove();
			$drop.off('click.checkerWrap');
			$drop.off('uglyMode');
			$footer.off('click');
			$items.off('click');

			$items.append(Template.item)
			.click(function(e){
				var $this = $(this), ck, $ck;
				if(uglyMode){
					$ck = $this.find('input[type=checkbox]');
					ck = $ck.checkbox();
					ck.toggle();
					checkFunc(ck);
					e.stopPropagation();
				}
			})
			;
			$drop.on('click.checkerWrap', '.checkerWrap', function(e){
				uglyMode = true;
				if(!$(this).find('.checkbox').length){
					showMultiUI();
				}else{
					$items.find('.checkerWrap > .checkbox').show();
					$footer.show();
				}
				$(this).find('input[type=checkbox]').checkbox().setChecked(true);
				count++;
				$all.text(count);
				self.singleViewVal = $seltTit.text();
				e.stopPropagation();
			})
			;

			$footer.on('click', function(e){
				e.stopPropagation();
			})
			.on('click', '.cancel', function(){
				cancelFunc();
			})
			.on('click', '.enter', function(){
				var vals = [], texts = [];
				$items.find('input[type=checkbox]').each(function(){
					var $item = $(this).parents('li');
					if($(this).prop('checked')){
						vals.push($item.data('val'));
						texts.push($item.text());
					}
				});
				if(!vals.length){ //如果一个都没选中，则默认选择第一项
					cancelFunc();
				}else{
					self.$el.data('uglyselectval', vals);
					if(texts.length > 1){
						multiText = texts[0]+'...';
					}else{
						multiText = texts[0];
					}
					$seltTit.text(multiText);
					self.$el.trigger({type:'uglySelect.change', value: vals});
					$drop.click();
				}
				
			})
			.on('click', '.all', function(e){
				if(count >= len){
					// allFunc(false);
					cancelFunc();
				}else{
					allFunc(true);
				}
				e.stopPropagation();
			})
			;

			// 如果有默认项，则设置默认项
			defaults = self.$el.data('uglyselectval');
			if(!isSearchAction && defaults){
				if(!$.isArray(defaults)){
					defaults = eval(defaults);///
				}
				showMultiUI();
				defaultTexts = []
				defaults.forEach(function(v){
					$items.each(function(){
						var val, $this;
						$this = $(this);
						val = $this.data('val');
						if(val == v){
							$this.find('input[type=checkbox]').checkbox().setChecked(true);
							defaultTexts.push($this.text());
							count++
						}
					});

				});
				if(defaultTexts.length > 1){
					multiText = defaultTexts[0]+'...';
				}else{
					multiText = defaultTexts[0];
				}
				$seltTit.text(multiText);
				uglyMode = true;
				$all.text(count);
			}

			return this;
		}
		, bindEvent: function(){
			var self = this;
			self.$el.on('selector.expan', function(){
				self.renderView();
				self.selector.dropbox.$drop.on('autoComplete.render', function(){
					// 搜索并且搜索框内有值时则，不需要额外把单选菜单中选中项添加到下拉菜单中
					self.renderView(!!$(this).find('.dropListFind').find('input').val());
				});
			});
			self.selector.dom.on('change', function(e,v){
				self.$el.trigger({type:'uglySelect.change', value: v});
			});
		}
		, setVal: function(arr) { return this;/// todo
			arr = arr || [];
			this.selector.dom.attr ('uglyselectval', arr);
			this.selector.dom.find('.seltTit').text(arr.join(','));
			return this;
		}
		, getVal: function() {
			return this.selector.dom.data('uglyselectval') || this.selector.getVal();
		}
	};
	
	$.fn.uglySelect = function(opt){
		var r, instance;

		r = this.each(function() {
			var handle = $(this).data("ugly_selector_handle");
			if(!handle){
				handle = new UglySelect($(this));
				$(this).data("ugly_selector_handle", handle);
			}
			instance = handle;
		});
		if(opt === 'instance'){
			return instance;
		}
		return r;
	};
})(jQuery);