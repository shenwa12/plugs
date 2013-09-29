;(function(win){
	var sl = win.scriptLoader = {};
	sl.load = function(urls, callback){
		var _scriptLoader = {
			index: 0,
			_load: function (url) {
				var head = document.head;
				var scrpits = document.getElementsByTagName('script');
				var has = false;
				for(var i=0; i<scrpits.length; i++){
					if(url == scrpits[i].src){
						has = true;
						break;
					}
				}
				if(!has){
					var script = document.createElement('script');
					script.src = url;///
					script.type = 'text/javascript';
					if (callback) {
						script.onreadystatechange = function () {//ie
							if (this.readyState == 'loaded') _scriptLoader.loadQueue();
						}
						script.onload = _scriptLoader.loadQueue;
					}
					head.appendChild(script);
				}else{
					_scriptLoader.loadQueue();
				}
			},
		 	loadQueue: function(){
		 		if(_scriptLoader.index < _scriptLoader.items.length){
			 		if (_scriptLoader.items[_scriptLoader.index]) {
						_scriptLoader._load(
							_scriptLoader.items[_scriptLoader.index++],
							function () {
								_scriptLoader.loadQueue();
							}
						)
					}
				}else{
					if(callback) callback(); 
					_scriptLoader.items.length = index = 0;
				}
		 	},
			load: function (items) {
				if(!items || items.length < 0) return;
				_scriptLoader.items = items;
				_scriptLoader.loadQueue();
			}
		}
		_scriptLoader.load(urls);
	}
})(window);