;(function($){
	function TabNav(_this, opts){
		this.$dom = $(_this);
		this._init();
	}
	TabNav.prototype = {
		_init: function () {
			var tabid = this.$dom.data('target');
			this.$contents;
			this.$navs = this.$dom.find('li');
			this.curIndex = 0;
			this.$block = this.$dom.find('.blockTrigger');


			if(this.$navs.length > 0) {
				this.liWidth = $(this.$navs[0]).width();
			}

			if(tabid){
				this.$contents = $('[data-tabid="'+tabid+'"]');
			}

			this._events();
		},
		_events: function(){
			var self = this;
			self.$dom.on('click', 'li', function(){
				var i = $(this).index();
				self._show(i);
			});

			self.$navs.hover(function(){
				self._animate($(this).index());
			},function(){
				self._animate(self.curIndex);
			});
		},
		_show: function(i){
			this.$navs.eq(i).addClass('cur').siblings().removeClass('cur');
			this._animate(i);

			if(this.$contents && this.$contents.eq(i)){
				this.$contents.eq(i).show().siblings('[data-tabid]').hide();
			}

			this.curIndex = i;
			this.$dom.trigger('change.tabNav',i);
		},
		_animate: function(i){
			this.$block.stop();
			// this.$block.animate({left: 100 * i + 10 * i + 10});
			this.$block.animate({left: (this.liWidth + 10 + 10) * i + 10});
		},
		show: function(i){
			this._show(i);
		}
	}

	$.fn.tabNav = function () {
	    return this.each(function () {
	      var $this = $(this)
	        , data = $this.data('tabNav');
	      if (!data) {
	      	$this.data('tabNav', (data = new TabNav(this)));
	      }else{
	      	return data;
	      }
	    });
	}
})(jQuery);