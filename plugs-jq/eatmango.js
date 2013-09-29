"use strict";

/**
 * [EatMango JSON数据操作库]
 * @version 1.0
 * @email: xiaodong1986@me.com
 * @date: 2012/12/18
 */

(function (name, definition, global) {
  if (typeof define === 'function') {// AMD
    define(definition);
  } else if (typeof module !== 'undefined' && module.exports) {// CommonJS
    module.exports = definition();
  } else {// normal
    global[name] = definition();
  }
})('EatMango', function(win){
	var db = function(){
		this.data = {};//数据源
		this.length = 0;
		this.isArray = false;//数据源是否是数组格式
		this._init.apply(this, arguments);
	};
	db.prototype = {
		_init: function(){
			var _data = arguments[0];
			if(_data){
				if(_data.isArray){
					this.isArray = true;
				}
				if(_EatMango.is.Object(_data.data)){
					this.data = _data.data;
					for(var k in this.data){
						this.length++;
					}
				}else if(_EatMango.is.Array(_data.data)){
					this.isArray = true;
					for(var i=0,j=_data.data.length; i<j; i++){
						this.data[_EatMango.UUID()] = _data.data[i];
						this.length++;
					}
				}
			}
		},
		_find: function(){
			var arg0 = arguments[0]
			,arg1 = arguments[1]
			,ret
			,isKey = false
			;

			if(!this.data) return [];
			if(!arguments.length || !arg0) return this.data;
			ret = [];
			if(arguments.length > 0){
				if(_EatMango.is.Object(arg0)){
					for(var k in arg0){
						if(k === '$key'){
							condition = arg0[k];
							isKey = true;
						}
					}
				}
				if(!isKey){
					for(var k in this.data){
						if(_EatMango.analysisCommand(arg0, this.data[k])){
							var o = {};
							o[k] = this.data[k];
							ret.push(o);
						}
					}
				}else{
					for(var k in this.data){
						if(k === condition){
							var o = {};
							o[k] = this.data[k];
							ret.push(o);
						}
					}
				}
			}
			if(_EatMango.is.Array(arg1)){///
				ret = ret.slice.apply(ret, arg1);
			}
			return ret;
		},
		_update: function(){
			var arg0 = arguments[0]
			,arg1 = arguments[1]
			,ret = this._find(arg0)
			;
			if(!arg1) return ret;

			for(var i=0, j=ret.length; i<j; i++){
				for(var k in ret[i]){
					for(var k1 in arg1){
						ret[i][k][k1] = arg1[k1];
					}
				}
			}
			return ret;
		},
		_insert: function(obj){
			if(_EatMango.is.Object(obj)){
				if(this.isArray){
					this.data[_EatMango.UUID()] = obj;
				}else{
					for(var k in obj){
						if(k === '$key'){
							this.data[obj[k]] = obj;
							delete obj[k];
						}
					}
				}
				this.length++;
			}
			return obj;
		},
		_delete: function(obj){
			var ret;
			if(_EatMango.is.Object(obj)){
				ret = this._find(obj);
				for(var i=0,j=ret.length; i<j; i++){
					for(var k in ret[i]){
						delete this.data[k];
						this.length--;
					}
				}
			}
			return ret;
		},
		_getResult: function(ret){//将结果转换为原始转入的数据形式[{},{}]
			var _ret = [];
			if(_EatMango.is.Array(ret)){
				for(var i=0,j=ret.length; i<j; i++){
					for(var k in ret[i]){
						_ret.push(ret[i][k]);
					}
				}
			}else if(_EatMango.is.Object(ret)){
				for(var k in ret){
					var o = {};
					_ret.push(ret[k]);
				}
			}
			return _ret;
		},
		find: function(cmd, limit){
			return this.isArray ? this._getResult(this._find(cmd, limit)) : this._find(cmd, limit);
		},
		findOne: function(cmd){
			return this.find(cmd).shift();
		},
		update: function(cmd, data){
			return this._getResult(this._update(cmd, data));
		},
		insert: function(obj){
			return this._insert(obj);
		},
		del: function(obj){
			return this.isArray ? this._getResult(this._delete(obj)) : this._delete(obj);
		},
		count: function(){
			return this.length;
		}
	};
	
	var _EatMango = {
		initialize: function(){
			var types = ["Array", "Boolean", "Date", "Number", "Object", "RegExp", "String", 'Function'];
			for(var i = 0, c; c = types[i++];){
			    this.is[c] = (function(type){
			        return function(obj){
			        	if(!obj) return false;
			            return Object.prototype.toString.call(obj) == "[object " + type + "]";
			       	}
			    })(c);
			}
		},
		//判断对象函数集
		is:{},
		_index: 0,
		UUID: function(){
			return ++this._index;
		},
		command: ['$gt', '$lt', '$gte', '$lte', '$ne', '$where', '$key', '$limit'],
		inArray: function(val, arr){
			var index = -1
			;
			if(val && _EatMango.is.Array(arr)){
				for(var i=0,j=arr.length; i<j; i++){
					if(val == arr[i]){
						index = i;
					}
				}
			}
			return index > -1;
		},
		//解析命令
		analysisCommand: function(cmd, o){
			var flag = true
			,isSubCommand = false
			,subFlag = true
			;
			if(_EatMango.is.String(cmd)){//String命令
				return (function(){
					return function(){
						return eval(cmd);///need optimize...
					}
				})().call(o);
			}else if(_EatMango.is.Function(cmd)){//Function命令
				return cmd.call(o);
			}else{

				for(var k in cmd){
					if(o[k] || _EatMango.is.String(cmd[k])){//数据源有此属性
						if(_EatMango.is.Array(cmd[k]) || _EatMango.is.Object(cmd[k])){
							if(_EatMango.is.Object(cmd[k])){
								for(var k1 in cmd[k]){
									if(_EatMango.inArray(k1, _EatMango.command)){
										isSubCommand = true;//是否有子命令
										switch(k1){
											case '$gt'://>
												if(o[k] <= cmd[k][k1]){
													subFlag = false;									
												}
											break;
											case '$lt'://<
												if(o[k] >= cmd[k][k1]){
													subFlag = false;
												}
											break;
											case '$gte'://>=
												if(o[k] < cmd[k][k1]){
													subFlag = false;
												}
											break;
											case '$lte'://<=
												if(o[k] > cmd[k][k1]){
													subFlag = false;
												}
											break;
											case '$ne'://!=
												if(o[k] === cmd[k][k1]){
													subFlag = false;
												}
											break;
										}
									}
								}
								if(!subFlag) return subFlag;
							}
							if(!isSubCommand){//不是子命令对象如：$gt,$lt之类的命令
								flag = _EatMango.analysisCommand(cmd[k], o[k]);
								if(!flag) return flag;//子循环中一旦发现不匹配就直接返回
							}
						}else{//直接对比命令与数据源
							if(_EatMango.inArray(k, _EatMango.command)){
								if(k === '$where'){
									return _EatMango.analysisCommand(cmd[k], o);
								}
								if(k === '$limit'){
									//console.log(cmd[k]);
									
								}
							}
							if(cmd[k] != o[k]){
								return false;//属性不匹配就直接返回	
							}
						}
					}else{
						return false;//没有属性直接返回
					}
				}
			}
			return flag;
		},
		create: function(dbsource){
			return new db(dbsource);
		}
	};
	_EatMango.initialize();
	
	return function(data){
		return new db(data);
	};
}, this);
