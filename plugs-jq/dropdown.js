(function ($){
	/**
	 * [dropdown 右键下拉菜单]
	 * eg:
	 * html:
	 * 		<button type="button" class="dropdown-toggle" data-toggle="dropdown" id="btn" data-dropmenu="[{val:1,text:'hello'},{val:2,text:'world'}]">hello</button>
	 * javascript:
	 * 		$('#btn1').dropdown();
	 * 	
	 */
	Dropdown = function (el, options) {
		this.$el = $(el);
	    this.options = $.extend({}, $.fn.dropdown.defaults, options);
	    this.dropbox = null;
		this._init();
	};
	Dropdown.prototype = {
		constructor: Dropdown,
		_init: function(){
			//注册dropbox插件
			if(!$.fn.dropbox){
				console.log('plug[select/init: 找不到dropbox插件');
				return ;
			}else{
				this.dropbox = this.$el.dropbox();	
			}
			this._bindEvent();
		},
		_bindEvent: function(){
			var self = this;
			self.$el.on('click', function(e){
				var $this = $(this);
				if($this.hasClass('cur')){
					self._hide();
					$this.removeClass('cur');
				}else{
					var s = '<ul class="dropList">';
					$.each(eval('('+$this.data('dropmenu')+')'), function(i,v){
						s += '<li data-val="'+ v.val +'">'+ v.text +'</li>';
					});
					s+='</ul>';
					self._show(s);
					$this.addClass('cur');
				}
				e.stopPropagation();
			});

			$('body').click(function(){///
				self.$el.removeClass('cur');
			});
		},
		_show: function(html){
			var self = this;
			var $s = $(html);
			//dropbox show
			self.dropbox.show($s);
			$s.on('click', 'li', function(){
				self.$el.trigger({
					type:'dropmenu.click',
					domTrigger:self.$el,
					dom:self.$el
				},$(this).data('val'));
			});
		},
		_hide: function(){
			this.dropbox.hide();
		}
	};

	$.fn.dropdown = function (option) {
	    return this.each(function () {
			var $this = $(this)
				, data = $this.data('dropdown')
			if (!data){
				$this.data('dropdown', (data = new Dropdown(this, option)))
			}
	    });
	  };
	$.fn.dropdown.defaults = {};
	$.fn.dropdown.Constructor = Dropdown;
})(window.jQuery);