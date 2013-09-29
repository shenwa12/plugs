;(function (name, definition, global) {
  // if (typeof define === 'function') {// AMD
  //   define(definition);
  // } else if (typeof module !== 'undefined' && module.exports) {// CommonJS
  //   module.exports = definition();
  // } else {// normal
    global[name] = definition();
  // }
})('DownLoader', function(){
	"use strict";
	
	var stopInterface
	, pauseInterface
	, resumeInterface
	, ids
	, dls
	, _DownLoader
	, DownLoader
	;

	stopInterface = pauseInterface = resumeInterface = function(){};

	/**
	 * [_DownLoader 下载器类]
	 * @param  {[type]} args [下载器参数]
	 */
	_DownLoader = function(args){
		this.args = args || {};
		this._init();
		this._bindEvent();
	};
	_DownLoader.prototype = {
		constructor: _DownLoader
		, _init: function(){
			var args = this.args;
			if(args.autoSpeed === undefined) args.autoSpeed = true; 
			this.downloaderID = args.id || $.now + Math.random();///下载器唯一id标识
			!ids && (ids = []);// 下载id列表 
			!dls && (dls = {});// 下载器列表
			ids.push(this.downloaderID);
			dls[this.downloaderID] = this;
			this.totalSize = args.totalSize || 0;
			this.isDown = false; // 下载完成
			this.setupComplete = false; // 安装完成
			this.loaded = this.loaded = 0;
			this.status = 0;// 0:检测, 1:下载, 2:安装
			this.toFixed = args.toFixed || 2;// 保留几位小数
			this.cancel = false; // 是否被取消

			this.$dlhook = $(args.downloader);
			if(!this.$dlhook) return;
			/// todo ui逻辑 待抽出到外面实现
			this.$stopBtn = this.$dlhook.find('.stopBtnHook');
			this.$pauseBtn = this.$dlhook.find('.pauseBtnHook');
			this.$totalSizeTxt = this.$dlhook.find('.totalSizeTxtHook');
			this.$curSizeTxt = this.$dlhook.find('.loadedTxtHook');
			this.$percentTxt = this.$dlhook.find('.currentPercentTxtHook');
			this.$speedTxt = this.$dlhook.find('.speedTxtHook');
			this.$fileNameTxt = this.$dlhook.find('.fileNameTxtHook');
			this.$fileNameTxt.html(args.fileName || '');
			this.$totalSizeTxt.text(this.parseUint(this.totalSize));

			this.$pauseBtn.data('pauseable', true);

			// 如果外部未提供速度值，则速度自算
			args.autoSpeed && this._speed();
			
			$.isFunction(this.args.init) && this.args.init.call(this, this.$dlhook);
		}
		, _bindEvent: function(){
			var self = this
			;
			// 停止按钮
			this.$stopBtn.click(function(){
				// stop download
				self.setDownLoadStatus('stop');
			});
			// 暂停按钮
			this.$pauseBtn.click(function(){
				if($(this).data('pauseable')){// 能否暂停
					self.setDownLoadStatus('pause');
				}else{// 否则恢复下载
					self.setDownLoadStatus('resume');
				}
			});
		}
		, _speed: function(){
			var preLoaded = 0;
			this.timer = setInterval(function(){

				this.$speedTxt.html(this.parseUint(this.loaded - preLoaded));
				preLoaded = this.loaded;
			}.bind(this), 1000);
		}
		, _setupping: function(per){
			if(this.setupComplete) return;
			this.status = 3;
			if(per >= 100) {
				this.status = 4;
				per = 100;
				$.isFunction(this.args.end) && this.args.end.call(this, 2); // end status 2 安装完成
				this.setupComplete = true;
			}
			this.$percentTxt.html(per.toFixed(this.toFixed) + '%');
			$.isFunction(this.args.setupping) && this.args.setupping.call(this, per);
		}
		, _update: function(v, toFixed){
			var r, rTxt;
			this.loaded = v;
			r = this.loaded / this.totalSize;
			if(r >= 1){// 防止宽度溢出
				if(this.isDown) return ; // 已下载完成则不再执行
				r = 1;
				this.isDown = true;
			}
			rTxt = r * 100;
			rTxt = rTxt.toFixed(0);
			v = this.parseUint(v);
			this.$curSizeTxt.html(v);
			this.$percentTxt.html((rTxt + '%'));
			$.isFunction(this.args.update) && this.args.update.call(this, rTxt);
			this.status = 1;
			if(r >= 1){
				this.status = 2;
				$.isFunction(this.args.end) && this.args.end.call(this, 1);// end status 1 下载完成
				
				this.timer && clearInterval(this.timer);// 如果存在速度自算时的计时器，则清掉
			}
		}
		/**
		 * [parseUint KB转换成M]
		 * @param  {[Float]} v       [原始值]
		 * @param  {[Int]} toFixed [保留几位小数]
		 * @return {[Float]}         [换算后的结果]
		 */
		, parseUint: function(v, toFixed){
			return ((v > 1024) ? v / (1024 * 1024) : v).toFixed(toFixed || this.toFixed || 0);
		}
		/**
		 * [speed 外部设置速度值]
		 * @param  {[Float]} v [当前速度值]
		 */
		, speed: function(v){
			if(!v || this.isDown){
				v = 0;
			}
			this.$speedTxt.html(this.parseUint(v));
		}
		/**
		 * [update 更新下载/安装状态]
		 * @param  {[Float]} v       [当前值]
		 * @param  {[Boolean]} type    [true为安装]
		 * @param  {[Int]} toFixed [显示值时保留几位小数]
		 */
		, update: function(v, type, toFixed){
			if(this.cancel) return ;
			if(type){
				this._setupping(v, toFixed);
			}else{
				this._update(v, toFixed);
			}
		},
		/**
		 * [setStatus 设置下载器状态]
		 * @param {[String]} cmd [状态命令]
		 */
		setDownLoadStatus: function(cmd){
			var id
			, args;
			if(!cmd) return ;
			id = this.downloaderID;
			args = this.args;
			this.cancel = false;
			switch(cmd){
				case 'stop':
					if(!args.statusChange){
						this.$stopBtn.text('已取消');
					}else{
						args.statusChange.call(this, 'stop');
					}

					stopInterface.call(this, id);
				break;
				case 'pause':
					// console.log('pause');
					if(!args.statusChange){
						this.$pauseBtn.text('恢复');
					}else{
						args.statusChange.call(this, 'stop');
					}
					pauseInterface.call(this, id);
					this.$pauseBtn.data('pauseable', false);
				break;
				case 'resume':
					// console.log('resume');
					if(!args.statusChange){
						this.$pauseBtn.text('暂停');
					}else{
						args.statusChange.call(this, 'pause');
					}
					resumeInterface.call(this, id);
					this.$pauseBtn.data('pauseable', true);
				break;
			}
		}
	};

	/**
	 * [DownLoader 下载器生成器]
	 * @param {[Object]} args [下载器参数]
	 */
	DownLoader = function(args){
		return new _DownLoader(args);
	};

	/******************************** 静态方法 ********************************/
	/**
	 * [set 设置C++(取消与暂停)接口]
	 * @param {[String]} key [stopInterface/pauseInterface/resumeInterface ]
	 */
	DownLoader.set = function(key, val){
		if(!$.isFunction(val)) return ;
		if(key === 'stopInterface'){
			stopInterface = val;
		}else if(key === 'pauseInterface'){
			pauseInterface = val;
		}else if(key === 'resumeInterface'){
			resumeInterface = val;
		}
	};

	/**
	 * [all 执行全部操作(暂停或取消)]
	 * @param  {[String]} operation [stop/pause]
	 */
	DownLoader.all = function(operation){
		var l, id, dl;
		if(!ids) return ;
		l = ids.length;
		while(id = ids.shift()){
			dl = dls[id];
			if(dl){
				dl.setDownLoadStatus(operation);
			};
		}
	};

	return DownLoader;
}, this);

