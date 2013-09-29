;(function($){
    "use strict";
    /**
     * [Keyboard 软键盘]
     * @version 1.2
     * @email: xiaodong1986@me.com
     * @date: 2013/4/13
     */
    // html 结构
    var Tmpl = '<div class="keyboard" style="display:none;">\
                  <div class="keyboardClose close_hook"><i></i></div>\
                  <ul>\
                    <li>~</li>\
                    <li>!</li>\
                    <li>@</li>\
                    <li>#</li>\
                    <li>$</li>\
                    <li>%</li>\
                    <li>^</li>\
                    <li>&</li>\
                    <li>*</li>\
                    <li>(</li>\
                    <li>)</li>\
                    <li>_</li>\
                    <li>+</li>\
                    <li>|</li>\
                    <li>\\</li>\
                    <li>`</li>\
                    <li class="num num_hook">1</li>\
                    <li class="num num_hook">2</li>\
                    <li class="num num_hook">3</li>\
                    <li class="num num_hook">4</li>\
                    <li class="num num_hook">5</li>\
                    <li class="num num_hook">6</li>\
                    <li class="num num_hook">7</li>\
                    <li class="num num_hook">8</li>\
                    <li class="num num_hook">9</li>\
                    <li class="num num_hook">0</li>\
                    <li>-</li>\
                    <li>=</li>\
                    <li class="backspace_hook">退格</li>\
                    <li><span class="lower lower_hook">q</span></li>\
                    <li><span class="lower lower_hook">w</span></li>\
                    <li><span class="lower lower_hook">e</span></li>\
                    <li><span class="lower lower_hook">r</span></li>\
                    <li><span class="lower lower_hook">t</span></li>\
                    <li><span class="lower lower_hook">y</span></li>\
                    <li><span class="lower lower_hook">u</span></li>\
                    <li><span class="lower lower_hook">i</span></li>\
                    <li><span class="lower lower_hook">o</span></li>\
                    <li><span class="lower lower_hook">p</span></li>\
                    <li>{</li>\
                    <li>}</li>\
                    <li>/</li>\
                    <li class="clear_hook">清除</li>\
                    <li><span class="lower lower_hook">a</span></li>\
                    <li><span class="lower lower_hook">s</span></li>\
                    <li><span class="lower lower_hook">d</span></li>\
                    <li><span class="lower lower_hook">f</span></li>\
                    <li><span class="lower lower_hook">g</span></li>\
                    <li><span class="lower lower_hook">h</span></li>\
                    <li><span class="lower lower_hook">j</span></li>\
                    <li><span class="lower lower_hook">k</span></li>\
                    <li><span class="lower lower_hook">l</span></li>\
                    <li>:</li>\
                    <li>"</li>\
                    <li>;</li>\
                    <li>\'</li>\
                    <li>[</li>\
                    <li>]</li>\
                    <li class="change change_hook">大小写切换</li>\
                    <li><span class="lower lower_hook">z</span></li>\
                    <li><span class="lower lower_hook">x</span></li>\
                    <li><span class="lower lower_hook">c</span></li>\
                    <li><span class="lower lower_hook">v</span></li>\
                    <li><span class="lower lower_hook">b</span></li>\
                    <li><span class="lower lower_hook">n</span></li>\
                    <li><span class="lower lower_hook">m</span></li>\
                    <li><</li>\
                    <li>></li>\
                    <li>?</li>\
                    <li>,</li>\
                    <li>.</li>\
                  </ul>\
                </div>';
    /**
     * [Keyboard 构造函数]
     * @param {[type]} _this [description]
     * @param {[type]} opts  [description]
     */
    function Keyboard(_this, opts){
      this.opts = opts;
      this.$trigger = $(_this)
      this.capital = false;// 大小写是否开启
      this.init();
    }
    Keyboard.prototype = {
      init: function () {
        var self = this;
        // 如果有指定output输出至某元素则输出至某元素否则输出给自身
        self.$output = self.opts.output ? $(self.opts.output) : self.$trigger;
        self.view();
        self.$abc = self.$el.find('.lower_hook');
        self.$nums = self.$el.find('.num_hook');
        // 0-9
        self.nums = [];
        for(var i=0; i<9; i++){
          self.nums.push(i);
        }
        // 将0-9键随机化显示
        self.randomNums();
        
        self.events();
      }
    , view: function () {
        var self = this
          , _w
          , ot = self.$output.offset()
          , w = self.$output.outerWidth()
          , h = self.$output.outerHeight()
          , offset = self.opts.offset;///
        this.$el = $(Tmpl).appendTo(self.opts.parent);
        _w = self.$el.outerWidth();

        // 将软键盘显示在触发元素的正下方
        self.$el.css({
          left: ot.left + (w - _w) / 2 + offset.left
        , top: ot.top + h + offset.top
        });
      }
    , events: function () {
        var self = this;
        // 显示软键盘
        self.$trigger.on('click', function (e) {
          self.toggle();
          e.stopPropagation();
        });
        self.$output.on('click', function (e) {
          e.stopPropagation();
        })
        // 阻止自身被点击产生的冒泡
        self.$el.on('click', function (e) {
          e.stopPropagation();
        })
        // 处理‘键’被点击
        .on('click', 'li', function (e) {
          var v,o,start,end,distance,pos, $this = $(this);
          if($this.hasClass('change_hook')){ // 切换大小写
            self.capital = !self.capital;
            self.$abc.each(function(){
              var f = self.capital ? 'toUpperCase' : 'toLowerCase';
              $(this).html($(this).html()[f]());
            })
          }else if($this.hasClass('clear_hook')){ // 清空
            self.$output.val('');
          }else if($this.hasClass('backspace_hook')){ // backspace
            pos = 0;
            o = self.$output[0];
            v = self.$output.val();
            start = o.selectionStart;
            end = o.selectionEnd;
            distance = end - start;
            if(start >= v.length){ // 如果光标在输入框最末
              self.$output.val(v.substr(0, start-1)); // 从最后一个字符位置开始删
            }else if(start > 0 || distance > 1){ // 如果光标处在中间或者文字被选中几个
              pos = distance < 1 ? start-1 : start; // 计算光标开始位置
              self.$output.val(v.substr(0, pos) + v.substr(end)); // 截取0-pos位置的字符加上end以后的所有字符
              // 显示光标
              o.selectionStart = pos;
              o.selectionEnd = pos;
            }
          }else{ // 普通输入
            pos = 0;
            o = self.$output[0];
            v = self.$output.val();
            start = o.selectionStart;
            end = o.selectionEnd;
            // 判断有没有同时选中几个文字
            pos = (end-start < 1) ? end+1 : start + 1;
            self.$output.val(v.substr(0, start)+ $this.text() + v.substr(end));// 截取0-pos位置的字符加上当前键文字再加上end以后的所有字符
            // 显示光标
            o.selectionStart = pos;
            o.selectionEnd = pos;
          }
        })
        // 关闭软键盘
        .on('click', '.close_hook', function () {
          self.toggle(false);
        });
      }
    , toggle: function(flag) {
        var self = this
        if(!self.$el.hasClass('keyboardActive')){
          self.randomNums(); // 显示时随机数字键盘
          self.setRange(); /// 显示光标或选中文字
          // 全局关闭软键盘
          $(document).on('click.' + 'keyboard', function () {
            self.toggle(false);
          });
          self.$el.css('display', 'block');
        } else {
          $(document).off('click.' + 'keyboard');
          var target = self.$el
            , time = 300
            , timeout = setTimeout(function() {
                target.off($.support.transition.end);
                self.$el.hide();
              }, time);
          target.one($.support.transition.end, function() {
            clearTimeout(timeout);
            self.$el.hide();
          });
        }
        setTimeout(function() {
          self.$el.toggleClass('keyboardActive', flag);
        }, 0);
      }
      /**
       * [setRange 显示光标或选中一段文字]
       */
    , setRange: function() {
          var o = this.$output[0];
          var start = o.selectionStart;
          var end = o.selectionEnd;
          o.setSelectionRange(start, end);
      }
      /**
       * [randomNums 随机显示数字键]
       * @return {[type]} [description]
       */
    , randomNums : function () {
        var self = this;
        self.nums.sort(self.random);
        self.$nums.each(function (i, v) {
          $(this).html(self.nums[i]);
        });
      }
      /**
       * [random 数组随机函数]
       * @return {[type]}   [description]
       */
    , random: function () {
        var v = Math.round(Math.random()*10);
        if(v > 5){
          return 1;
        }else if(v < 5){
          return -1;
        }else{
          return 0;
        }
      }
    }
    
    $.fn.keyboard = function(opt){
      var r, handle;
      r = this.each(function() {
        var _handle = $(this).data('keyboard');
        if(!_handle) {
          _handle = new Keyboard($(this), $.extend(true, {}, $.fn.keyboard.defaults, opt));
          $(this).data('keyboard', _handle);
        }
        handle = _handle;
      });
      // if(typeof(opt) === 'string' && $.isFunction(handle[opt])) {
      //   handle[opt].apply(handle, Array.prototype.splice.call(arguments, 1));
      // }
      return r;
    };
    $.fn.keyboard.defaults = {
      callback: null
      , trigger: null
      // 输出至某元素，默认为自身
      , output: null
      // 偏移
      , offset: {left:0, top:0}
      // 可设置软软键盘容器
      , parent: document.body
    };
  })(jQuery);