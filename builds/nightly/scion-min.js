(function(){if(!this.require){var a={},b={},c=function(f,g){var h=d(g,f),i=b[h],j;if(i)return i.exports;if(!(j=a[h]||a[h=d(h,"./index")]))throw"module '"+f+"' not found";i={id:h,exports:{}};try{return b[h]=i,j(i.exports,function(a){return c(a,e(h))},i),i.exports}catch(k){throw delete b[h],k}},d=function(a,b){var c=[],d,e;/^\.\.?(\/|$)/.test(b)?d=[a,b].join("/").split("/"):d=b.split("/");for(var f=0,g=d.length;f<g;f++)e=d[f],e==".."?c.pop():e!="."&&e!=""&&c.push(e);return c.join("/")},e=function(a){return a.split("/").slice(0,-1).join("/")};this.require=function(a){return c(a,"")},this.require.define=function(b){for(var c in b)a[c]=b[c]}}return this.require.define}).call(this)({"browser/SCXML":function(a,b,c){function h(a,b){window.jQuery.get(a,function(a){b(null,k(a))},"xml").error(function(a){b(a)})}function i(a){return(new window.DOMParser).parseFromString(a,"application/xml")}function j(a){return k(i(a))}function k(a){var b=e.parseDOM(a),c=b[1],d=f.transform(c),h=g(d);return h}var d=b("../core/scxml/SCXML"),e=b("../external/jsonml/jsonml-dom"),f=b("../core/util/annotate-scxml-json"),g=b("../core/scxml/json2model");d.SimpleInterpreter.prototype._setTimeout=function(a,b){return window.setTimeout(a,b)},d.SimpleInterpreter.prototype._clearTimeout=function(a){return window.clearTimeout(a)},d.SimpleInterpreter.prototype._log=window.console.log||function(){},c.exports={pathToModel:h,urlToModel:h,documentStringToModel:j,documentToModel:k,parseDocumentString:i,SCXML:d.SimpleInterpreter}},"browser/browser-listener-client":function(a,b,c){},"browser/build/stitch":function(a,b,c){var d=b("stitch"),e=b("fs"),f=d.createPackage({paths:["lib/"],excludes:["lib/node","lib/rhino","lib/browser/build"]});f.compile(function(a,b){e.writeFile("scion.js",b,function(a){if(a)throw a;console.log("Compiled scion.js")})})},"core/scxml/SCXML":function(exports,require,module){function getTransitionWithHigherSourceChildPriority(a){return function(a){var b=a[0],c=a[1];return b.source.depth<c.source.depth?c:c.source.depth<b.source.depth?b:b.documentOrder<c.documentOrder?b:c}}function SCXMLInterpreter(model,opts){this.model=model,this.opts=opts,this.opts.log=this.opts.log||this._log,this.opts.StateIdSet=this.opts.StateIdSet||ArraySet,this.opts.EventSet=this.opts.EventSet||ArraySet,this.opts.TransitionPairSet=this.opts.TransitionPairSet||ArraySet,this.opts.priorityComparisonFn=this.opts.priorityComparisonFn||getTransitionWithHigherSourceChildPriority(this.opts.model),this.opts.globalEval=this.opts.globalEval||eval,this._configuration=new this.opts.BasicStateSet,this._historyValue={},this._innerEventQueue=[],this._isInFinalState=!1,this._datamodel=Object.create(this.model.datamodel),this._timeoutMap={},this._listeners=[]}function SimpleInterpreter(a,b){b=b||{},setupDefaultOpts(b),this._isStepping=!1,this._send=b.send||this._send,this._cancel=b.cancel||this._cancel,SCXMLInterpreter.call(this,a,b)}var ArraySet=require("./set/ArraySet"),stateKinds=require("./state-kinds-enum"),setupDefaultOpts=require("./setup-default-opts"),scxmlPrefixTransitionSelector=require("./scxml-dynamic-name-match-transition-selector");SCXMLInterpreter.prototype={start:function(){this.opts.printTrace&&this._log("performing initial big step"),this._configuration.add(this.model.root.initial),this.model.scripts.forEach(function(script){with(this._datamodel)this.opts.globalEval(script)},this);for(var k in this._datamodel){var v=this._datamodel[k];typeof v=="string"&&(this._datamodel[k]=eval("("+v+")"))}return this._performBigStep(),this.getConfiguration()},getConfiguration:function(){return this._configuration.iter().map(function(a){return a.id})},getFullConfiguration:function(){return this._configuration.iter().map(function(a){return[a].concat(this.opts.model.getAncestors(a))},this).reduce(function(a,b){return a.concat(b)},[]).map(function(a){return a.id}).reduce(function(a,b){return a.indexOf(b)>-1?a:a.concat(b)},[])},isIn:function(a){return this.getFullConfiguration().indexOf(a)>-1},_performBigStep:function(a){a&&this._innerEventQueue.push(new this.opts.EventSet([a]));var b=!0;while(b){var c=this._innerEventQueue.length?this._innerEventQueue.shift():new this.opts.EventSet,d={},e=this._performSmallStep(c,d);b=!e.isEmpty()}this._isInFinalState=this._configuration.iter().every(function(a){return a.kind===stateKinds.FINAL})},_performSmallStep:function(a,b){this.opts.printTrace&&this._log("selecting transitions with eventSet: ",a);var c=this._selectTransitions(a,b);this.opts.printTrace&&this._log("selected transitions: ",c);if(!c.isEmpty()){this.opts.printTrace&&this._log("sorted transitions: ",c);var d=new this.opts.TransitionSet(c.iter().filter(function(a){return a.targets})),e=this._getStatesExited(d),f=e[0],g=e[1],h=this._getStatesEntered(d),i=h[0],j=h[1];this.opts.printTrace&&this._log("basicStatesExited ",f),this.opts.printTrace&&this._log("basicStatesEntered ",i),this.opts.printTrace&&this._log("statesExited ",g),this.opts.printTrace&&this._log("statesEntered ",j);var k=new this.opts.EventSet;this.opts.printTrace&&this._log("executing state exit actions"),g.forEach(function(c){this.opts.printTrace&&this._log("exiting ",c),this._listeners.forEach(function(a){a.onExit&&a.onExit(c.id)}),c.onexit.forEach(function(c){this._evaluateAction(c,a,b,k)},this);var d;c.history&&(c.history.isDeep?d=function(a){return a.kind===stateKinds.BASIC&&c.descendants.indexOf(a)>-1}:d=function(a){return a.parent===c},this._historyValue[c.history.id]=g.filter(d))},this);var l=c.iter().sort(function(a,b){return a.documentOrder-b.documentOrder});this.opts.printTrace&&this._log("executing transitition actions"),l.forEach(function(c){var d=c.targets&&c.targets.map(function(a){return a.id});this._listeners.forEach(function(a){a.onTransition&&a.onTransition(c.source.id,d)}),c.actions.forEach(function(c){this._evaluateAction(c,a,b,k)},this)},this),this.opts.printTrace&&this._log("executing state enter actions"),j.forEach(function(c){this._listeners.forEach(function(a){a.onEntry&&a.onEntry(c.id)}),c.onentry.forEach(function(c){this._evaluateAction(c,a,b,k)},this)},this),this.opts.printTrace&&this._log("updating configuration "),this.opts.printTrace&&this._log("old configuration ",this._configuration),this._configuration.difference(f),this._configuration.union(i),this.opts.printTrace&&this._log("new configuration ",this._configuration),k.isEmpty()||(this.opts.printTrace&&this._log("adding triggered events to inner queue ",k),this._innerEventQueue.push(k)),this.opts.printTrace&&this._log("updating datamodel for next small step :");for(var m in b)this.opts.printTrace&&this._log("key ",m),m in this._datamodel?this.opts.printTrace&&this._log("old value ",this._datamodel[m]):this.opts.printTrace&&this._log("old value is null"),this.opts.printTrace&&this._log("new value ",b[m]),this._datamodel[m]=b[m]}return c},_evaluateAction:function(a,b,c,d){var e=function(){var d={};return a.content?d=a.content:(a.namelist&&a.namelist.forEach(function(a){d[a]=this._datamodel[a]},this),a.params.forEach(function(a){a.expr?d[a.name]=this._eval(a.expr,c,b):a.location&&(d[a.name]=this._datamodel[a.location])},this)),d}.bind(this);switch(a.type){case"raise":this.opts.printTrace&&this._log("sending event",a.event,"with content",a.contentexpr),d.add({name:a.event});break;case"assign":this._datamodel[a.location]=this._eval(a,c,b);break;case"script":this._eval(a,c,b,!0);break;case"log":this.opts.log(this._eval(a,c,b));break;case"send":this._send&&this._send({target:a.targetexpr?this._eval(a.targetexpr,c,b):a.target,name:a.eventexpr?this._eval(a.eventexpr,c,b):a.event,data:e(),origin:this.opts.origin,type:a.typeexpr?this._eval(a.typeexpr,c,b):a.sendType},{delay:a.delayexpr?this._eval(a.delayexpr,c,b):a.delay,sendId:a.idlocation?this._datamodel[a.idlocation]:a.id});break;case"cancel":this._cancel&&this._cancel(a.sendid);break;default:}},_eval:function(a,b,c,d){var e=this._getScriptingInterface(b,c,d);return a.evaluate.call(this.opts.evaluationContext,e.getData,e.setData,e.In,e.events,this._datamodel)},_getScriptingInterface:function(a,b,c){return{setData:c?function(b,c){return a[b]=c}:function(){},getData:function(a){return this._datamodel[a]}.bind(this),In:function(a){return this.isIn(a)}.bind(this),events:b.iter()}},_getStatesExited:function(a){var b=new this.opts.StateSet,c=new this.opts.BasicStateSet;a.iter().forEach(function(a){var d=a.lca,e=d.descendants;this._configuration.iter().forEach(function(a){e.indexOf(a)>-1&&(c.add(a),b.add(a),this.opts.model.getAncestors(a,d).forEach(function(a){b.add(a)}))},this)},this);var d=b.iter().sort(function(a,b){return b.depth-a.depth});return[c,d]},_getStatesEntered:function(a){var b=new this.opts.StateSet,c=new this.opts.BasicStateSet,d=new this.opts.StateSet,e=[],f=function(a,c){g(c);var e=this.opts.model.getLCA(a,c);this.opts.model.getAncestors(c,e).forEach(function(a){a.kind===stateKinds.COMPOSITE?(b.add(a),d.add(a)):g(a)})}.bind(this),g=function(a){if(d.contains(a))return;a.kind===stateKinds.HISTORY?a.id in this._historyValue?this._historyValue[a.id].forEach(function(b){f(a,b)}):(b.add(a),c.add(a)):(b.add(a),a.kind===stateKinds.PARALLEL?e.push.apply(e,a.children.filter(function(a){return a.kind!==stateKinds.HISTORY})):a.kind===stateKinds.COMPOSITE?e.push(a.initial):(a.kind===stateKinds.INITIAL||a.kind===stateKinds.BASIC||a.kind===stateKinds.FINAL)&&c.add(a)),d.add(a)}.bind(this);a.iter().forEach(function(a){a.targets.forEach(function(b){f(a.source,b)})});var h;while(h=e.pop())g(h);var i=b.iter().sort(function(a,b){return a.depth-b.depth});return[c,i]},_selectTransitions:function(a,b){if(this.opts.onlySelectFromBasicStates)var c=this._configuration.iter();else{var d=new this.opts.StateSet;this._configuration.iter().forEach(function(a){d.add(a),this.opts.model.getAncestors(a).forEach(function(a){d.add(a)})},this),c=d.iter()}var e=this._getScriptingInterface(b,a),f=function(a){return a.evaluateCondition.call(this.opts.evaluationContext,e.getData,e.setData,e.In,e.events,this._datamodel)}.bind(this),g=a.iter().map(function(a){return a.name}),h=g.filter(function(a){return a.search(".")}).length,i=h?scxmlPrefixTransitionSelector:this.opts.transitionSelector,j=new this.opts.TransitionSet;c.forEach(function(a){i(a,g,f).forEach(function(a){j.add(a)})});var k=this._selectPriorityEnabledTransitions(j);return this.opts.printTrace&&this._log("priorityEnabledTransitions",k),k},_selectPriorityEnabledTransitions:function(a){var b=new this.opts.TransitionSet,c=this._getInconsistentTransitions(a),d=c[0],e=c[1];b.union(d),this.opts.printTrace&&this._log("enabledTransitions",a),this.opts.printTrace&&this._log("consistentTransitions",d),this.opts.printTrace&&this._log("inconsistentTransitionsPairs",e),this.opts.printTrace&&this._log("priorityEnabledTransitions",b);while(!e.isEmpty())a=new this.opts.TransitionSet(e.iter().map(function(a){return this.opts.priorityComparisonFn(a)},this)),c=this._getInconsistentTransitions(a),d=c[0],e=c[1],b.union(d),this.opts.printTrace&&this._log("enabledTransitions",a),this.opts.printTrace&&this._log("consistentTransitions",d),this.opts.printTrace&&this._log("inconsistentTransitionsPairs",e),this.opts.printTrace&&this._log("priorityEnabledTransitions",b);return b},_getInconsistentTransitions:function(a){var b=new this.opts.TransitionSet,c=new this.opts.TransitionPairSet,d=a.iter();this.opts.printTrace&&this._log("transitions",d);for(var e=0;e<d.length;e++)for(var f=e+1;f<d.length;f++){var g=d[e],h=d[f];this._conflicts(g,h)&&(b.add(g),b.add(h),c.add([g,h]))}var i=a.difference(b);return[i,c]},_conflicts:function(a,b){return!this._isArenaOrthogonal(a,b)},_isArenaOrthogonal:function(a,b){var c=a.targets?a.lca:a.source,d=b.targets?b.lca:b.source,e=this.opts.model.isOrthogonalTo(c,d);return this.opts.printTrace&&(this._log("transition LCAs",c.id,d.id),this._log("transition LCAs are orthogonal?",e)),e},registerListener:function(a){return this._listeners.push(a)},unregisterListener:function(a){return this._listeners.splice(this._listeners.indexOf(a),1)}},SimpleInterpreter.prototype=Object.create(SCXMLInterpreter.prototype),SimpleInterpreter.prototype.gen=function(a,b){var c;switch(typeof a){case"string":c={name:a,data:b};break;case"object":if(typeof a.name!="string")throw new Error('Event object must have "name" property of type string.');c=a;break;default:throw new Error("First argument to gen must be a string or object.")}if(this._isStepping)throw new Error("gen called before previous call to gen could complete. If executed in single-threaded environment, this means it was called recursively, which is illegal, as it would break SCION step semantics.");return this._isStepping=!0,this._performBigStep(c),this._isStepping=!1,this.getConfiguration()},SimpleInterpreter.prototype._send=function(a,b){var c,d,e=this;if(!this._setTimeout)throw new Error("setTimeout function not set");this.opts.printTrace&&this._log("sending event",a.name,"with content",a.data,"after delay",b.delay),c=function(){return e.gen(a)},d=this._setTimeout(c,b.delay);if(b.sendid)return this._timeoutMap[b.sendid]=d},SimpleInterpreter.prototype._cancel=function(a){if(!this._clearTimeout)throw new Error("clearTimeout function not set");if(a in this._timeoutMap)return this.opts.printTrace&&this._log("cancelling ",a," with timeout id ",this._timeoutMap[a]),this._clearTimeout(this._timeoutMap[a])},module.exports={SCXMLInterpreter:SCXMLInterpreter,SimpleInterpreter:SimpleInterpreter}},"core/scxml/default-transition-selector":function(a,b,c){c.exports=function(a,b,c){return a.transitions.filter(function(a){return!a.event||b.indexOf(a.event)>-1&&(!a.cond||c(a))})}},"core/scxml/json2model":function(a,b,c){function d(a){return a?a.slice(-2)==="ms"?parseFloat(a.slice(0,-2)):a.slice(-1)==="s"?parseFloat(a.slice(0,-1))*1e3:parseFloat(a):0}function e(a,b){return new Function("getData","setData","In","_events","datamodel","var _event = _events[0]; with(datamodel){"+(b?"return":"")+" "+a+"}")}c.exports=function(a){function b(a){return c[a]}var c={};return a.states.forEach(function(a){c[a.id]=a}),a.transitions.forEach(function(a){a.evaluateCondition=e(a.cond,!0)}),a.states.forEach(function(f){f.transitions=f.transitions.map(function(b){return a.transitions[b]});var g=f.onentry.concat(f.onexit);f.transitions.forEach(function(a){a.actions.forEach(function(a){g.push(a)}),a.lca&&(a.lca=c[a.lca])}),g.forEach(function(a){switch(a.type){case"script":a.evaluate=e(a.script);break;case"assign":a.evaluate=e(a.expr,!0);break;case"send":["contentexpr","eventexpr","targetexpr","typeexpr","delayexpr"].filter(function(b){return a[b]}).forEach(function(b){a[b]={evaluate:e(a[b],!0)}}),a.params.forEach(function(a){a.expr&&(a.expr={evaluate:e(a.expr,!0)})});break;case"log":a.evaluate=e(a.expr,!0);break;default:}a.type==="send"&&a.delay&&(a.delay=d(a.delay))}),f.initial=c[f.initial],f.history=c[f.history],f.children=f.children.map(b),f.parent=c[f.parent],f.ancestors&&(f.ancestors=f.ancestors.map(b)),f.descendants&&(f.descendants=f.descendants.map(b)),f.transitions.forEach(function(a){a.source=c[a.source],a.targets=a.targets&&a.targets.map(b)})}),a.root=c[a.root],a}},"core/scxml/model":function(a,b,c){var d=b("./state-kinds-enum");c.exports={getAncestors:function(a,b){var c,d,e;return d=a.ancestors.indexOf(b),d>-1?a.ancestors.slice(0,d):a.ancestors},getAncestorsOrSelf:function(a,b){return[a].concat(this.getAncestors(a,b))},getDescendantsOrSelf:function(a){return[a].concat(a.descendants)},isOrthogonalTo:function(a,b){return!this.isAncestrallyRelatedTo(a,b)&&this.getLCA(a,b).kind===d.PARALLEL},isAncestrallyRelatedTo:function(a,b){return this.getAncestorsOrSelf(b).indexOf(a)>-1||this.getAncestorsOrSelf(a).indexOf(b)>-1},getLCA:function(a,b){var c=this.getAncestors(a).filter(function(a){return a.descendants.indexOf(b)>-1},this);return c[0]}}},"core/scxml/scxml-dynamic-name-match-transition-selector":function(a,b,c){function e(a){return new RegExp("^"+a.replace(/\./g,"\\.")+"(\\.[0-9a-zA-Z]+)*$")}function f(a){return d[a]?d[a]:d[a]=e(a)}function g(a,b){var c=a.events,d=c.indexOf("*")>-1?function(){return!0}:function(a){return c.filter(function(b){return f(b).test(a)}).length};return b.filter(d).length}var d={};c.exports=function(a,b,c){return a.transitions.filter(function(a){return(!a.events||g(a,b))&&(!a.cond||c(a))})}},"core/scxml/set/ArraySet":function(a,b,c){c.exports=function(a){a=a||[],this.o=[],a.forEach(function(a){this.add(a)},this)},c.exports.prototype={add:function(a){if(!this.contains(a))return this.o.push(a)},remove:function(a){var b=this.o.indexOf(a);return b===-1?!1:(this.o.splice(b,1),!0)},union:function(a){return a=a.iter?a.iter():a,a.forEach(function(a){this.add(a)},this),this},difference:function(a){return a=a.iter?a.iter():a,a.forEach(function(a){this.remove(a)},this),this},contains:function(a){return this.o.indexOf(a)>-1},iter:function(){return this.o},isEmpty:function(){return!this.o.length},equals:function(a){var b=a.iter(),c=this.o;return c.every(function(a){return b.indexOf(a)>-1})&&b.every(function(a){return c.indexOf(a)>-1})},toString:function(){return"Set("+this.o.toString()+")"}}},"core/scxml/setup-default-opts":function(a,b,c){var d=b("./scxml-dynamic-name-match-transition-selector"),e=b("./set/ArraySet"),f=b("./model");c.exports=function(a){return a=a||{},a.TransitionSet=a.TransitionSet||e,a.StateSet=a.StateSet||e,a.BasicStateSet=a.BasicStateSet||e,a.transitionSelector=a.transitionSelector||d,a.model=a.model||f,a}},"core/scxml/state-kinds-enum":function(a,b,c){c.exports={BASIC:0,COMPOSITE:1,PARALLEL:2,HISTORY:3,INITIAL:4,FINAL:5}},"core/util/annotate-scxml-json":function(a,b,c){function p(a){var b=[];return a.forEach(function(a){var c=r(a),d=c[0],e=c[1],f=c[2];d==="script"&&b.push.apply(b,f.filter(function(a){return typeof a=="string"}))}),b}function q(a){var b,c,d;c=0,d={};for(b in a)d[b]={name:b,documentOrder:c++};return d}function r(a,b){var c,d,e,f,g;return g=a[0],f=a[1],f&&typeof f=="object"&&!Array.isArray(f)&&typeof f!="string"?(c=f,e=a.slice(2)):(c={},e=a.slice(1)),b&&(e=e.filter(function(a){return typeof a!="string"})),[g,c,e]}function t(a,b){var c=r(a,!0),d=c[0],e=c[1],f=c[2];if(e.event){var g;e.event==="*"?g=[e.event]:g=e.event.trim().split(/\s+/).map(function(a){var b=a.match(s);if(b){var c=b[1];if(!b||!c)throw new Error("Unable to parse event: "+a);return c}}),g.filter(function(a){return a!=="*"}).forEach(function(a){i[a]=!0});if(g.indexOf(undefined)>-1)throw new Error("Error parsing event attribute attributes.event")}var h={documentOrder:j.length,id:j.length,source:b.id,cond:e.cond,events:g,actions:f.map(function(a){return v(a)}),targets:e&&e.target&&e.target.trim().split(/\s+/)};return j.push(h),h}function u(a){var b=r(a),c=b[0],d=b[1],e=b[2];return{name:d.name,expr:d.expr,location:d.location}}function v(a){var b=r(a),c=b[0],d=b[1],e=b[2];switch(c){case"if":return{type:"if",cond:d.cond,actions:e.map(function(a){return v(a)})};case"elseif":return{type:"elseif",cond:d.cond,actions:e.map(function(a){return v(a)})};case"else":return{type:"else",actions:e.map(function(a){return v(a)})};case"log":return{type:"log",expr:d.expr,label:d.label};case"script":return{type:"script",script:e.join("\n")};case"send":return{type:"send",sendType:d.type,delay:d.delay,id:d.id,event:d.event,target:d.target,idlocation:d.idlocation,namelist:d&&d.namelist&&d.namelist.trim().split(/ +/),params:e.filter(function(a){return a[0]==="param"}).map(function(a){return u(a)}),content:e.filter(function(a){return a[0]==="content"}).map(function(a){return r(a)[2][0]})[0],eventexpr:d.eventexpr,targetexpr:d.targetexpr,typeexpr:d.typeexpr,delayexpr:d.delayexpr};case"cancel":return{type:"cancel",sendid:d.sendid};case"assign":return{type:"assign",location:d.location,expr:d.expr};case"raise":return{type:"raise",event:d.event};case"invoke":throw new Error("Element "+c+" not yet supported");case"finalize":throw new Error("Element "+c+" not yet supported");default:return null}}function w(a,b){var c=r(a,!0),d=c[0],e=c[1],f=c[2];f.filter(function(a){return a[0]==="data"}).forEach(function(a){var b=r(a,!0),c=b[0],d=b[1],e=b[2];d.id&&(m[d.id]=d.expr||null)})}function x(a,b){var c=r(a,!0),i=c[0],j=c[1],l=c[2],m=j&&j.id||A(i),n;switch(i){case"state":l.filter(function(a){return f.indexOf(a[0])>-1}).length?n=d.COMPOSITE:n=d.BASIC;break;case"scxml":n=d.COMPOSITE;break;case"initial":n=d.INITIAL;break;case"parallel":n=d.PARALLEL;break;case"final":n=d.FINAL;break;case"history":n=d.HISTORY;break;default:}var o={id:m,kind:n,descendants:[]};k[m]=o,b.length&&(o.parent=b[b.length-1]),n===d.HISTORY&&(o.isDeep=j.type==="deep"?!0:!1),o.documentOrder=g.length,g.push(o);if(n===d.BASIC||n===d.INITIAL||n===d.HISTORY)o.basicDocumentOrder=h.length,h.push(o);o.depth=b.length,o.ancestors=b.slice(),b.forEach(function(a){k[a].descendants.push(o.id)});var p=[],q=[],s=[],u=[],y=b.concat(o.id),z=!1,B=null,C=function(a){var b=x(a,y);return o.initial=b.id,u.push(b),z=!0};l.filter(function(a){return Array.isArray(a)}).forEach(function(a){var b=r(a,!0),c=b[0],d=b[1],f=b[2];switch(c){case"transition":s.push(t(a,o));break;case"onentry":f.forEach(function(a){q.push(v(a))});break;case"onexit":f.forEach(function(a){p.push(v(a))});break;case"initial":if(!!z)throw new Error("Encountered duplicate initial states in state "+o.id);C(a);break;case"history":var g=x(a,y);o.history=g.id,u.push(g);break;case"datamodel":w(a,y);break;default:if(e.indexOf(c)>-1){var h=x(a,y);B===null&&(B=h),u.push(h)}}});if(!z&&i!=="parallel"){var D=j&&j.initial;function E(a){var b;return b=["initial",["transition",{target:a}]],C(b)}D?E(j.initial):B&&E(B.id)}return o.onexit=p,o.onentry=q,o.transitions=s.map(function(a){return a.documentOrder}),o.children=u.map(function(a){return a.id}),o}function A(a){return z[a]=z[a]||0,""+y+"-"+a+"-"+z[a]++}function B(a,b){var c,d,e,f,g,h,i;e=[],a.ancestors.forEach(function(a){d=k[a],d.descendants.indexOf(b.id)>-1&&e.push(a)});if(!e.length)throw new Error("Could not find LCA for states.");return e[0]}var d=b("../scxml/state-kinds-enum"),e=["state","parallel","history","final","initial"],f=e.concat("scxml"),g,h,i,j,k,l,m,n=a.transformAndSerialize=n=function(a){return JSON.stringify(o(a))},o=a.transform=function(a){g=[],h=[],i={},j=[],k={},l=[],m={};var b=x(a,[]),c=r(a),d=c[0],e=c[1],f=c[2];return g.forEach(function(a){a.ancestors.reverse()}),g.forEach(function(a){a.descendants.reverse()}),j.filter(function(a){return a.targets}).forEach(function(a){var b=k[a.source],c=a.targets.map(function(a){return k[a]});if(!b)throw new Error("source missing");if(!c.length)throw new Error("target missing");a.lca=B(b,c[0])}),{states:g,transitions:j,root:b.id,events:q(i),scripts:p(f),profile:e.profile,version:e.version,datamodel:m}},s=/^((([^.]+)\.)*([^.]+))(\.\*)?$/,y="$generated",z={};if(b.main===c){var C=process.argv[2],D=process.argv[3];function E(a){var c,d,e;return e=JSON.parse(a),d=n(e,!0,!0,!0,!0),D==="-"?process.stdout.write(d):(c=b("fs"),c.writeFileSync(D,d,"utf-8"))}if(!C||C==="-"){process.stdin.resume(),process.stdin.setEncoding("utf-8");var F="";process.stdin.on("data",function(a){return F+=a}),process.stdin.on("end",function(){return E(F)})}else{var G=b("fs"),H=G.readFileSync(C,"utf-8");E(H)}}},"core/util/easy":function(a,b,c){a.browser.interpreterFromUrl=function(b,c,d){b.get(c,function(b){var c=a.browser.interpreterFromXMLDoc(b);d(c)})},a.browser.interpreterFromXMLDoc=function(a){function g(a){a.preventDefault(),f.gen({name:a.type,data:a})}var b=JsonML.parseDOM(scxmlToTransform),c=b[1],d=scion.annotator.transform(c),e=scion.json2model(d),f=new scion.scxml.BrowserInterpreter(e);f.start(),f.gen({name:"init",data:rect}),$(rect).mousedown(g),$(document.documentElement).bind("mouseup mousemove",g)}},"external/jsonml/jsonml-dom":function(a,b,c){var d=d||{};(function(a){"use strict";var b=typeof Packages!="undefined",c=b?function(a,b){return a.item(b)}:function(a,b){return a[b]};a.parseDOM=function(d,e){function f(b,d,e){if(b.hasChildNodes()){for(var f=0;f<b.childNodes.length;f++){var g=c(b.childNodes,f);g=a.parseDOM(g,d),g&&e.push(g)}return!0}return!1}if(!d||!d.nodeType)return d=null;var g,h;switch(d.nodeType){case 1:case 9:case 11:h=[d.tagName||""];var i=d.attributes,j={},k=!1;for(g=0;i&&g<i.length;g++)if(c(i,g).specified){if(c(i,g).name==="style")j.style=d.style.cssText||c(i,g).value;else if("string"==typeof c(i,g).value||b&&i.item(g).value instanceof Packages.java.lang.String)j[c(i,g).name]=c(i,g).value;k=!0}k&&h.push(j);var l;switch(h[0].toLowerCase()){case"frame":case"iframe":try{"undefined"!=typeof d.contentDocument?l=d.contentDocument:"undefined"!=typeof d.contentWindow?l=d.contentWindow.document:"undefined"!=typeof d.document&&(l=d.document),l=a.parseDOM(l,e),l&&h.push(l)}catch(m){}break;case"style":l=d.styleSheet&&d.styleSheet.cssText;if(l&&"string"==typeof l)l=l.replace("<!--","").replace("-->",""),h.push(l);else if(d.hasChildNodes())for(g=0;g<d.childNodes.length;g++)l=d.childNodes[g],l=a.parseDOM(l,e),l&&"string"==typeof l&&(l=l.replace("<!--","").replace("-->",""),h.push(l));break;case"input":f(d,e,h),l=d.type!=="password"&&d.value,l&&(k||(h.shift(),j={},h.unshift(j),h.unshift(d.tagName||"")),j.value=l);break;case"textarea":f(d,e,h)||(l=d.value||d.innerHTML,l&&"string"==typeof l&&h.push(l));break;default:f(d,e,h)}return"function"==typeof e&&(h=e(h,d)),d=null,h;case 3:case 4:var n=String(d.nodeValue);return d=null,n;case 10:h=["!"];var o=["DOCTYPE",(d.name||"html").toLowerCase()];return d.publicId&&o.push("PUBLIC",'"'+d.publicId+'"'),d.systemId&&o.push('"'+d.systemId+'"'),h.push(o.join(" ")),"function"==typeof e&&(h=e(h,d)),d=null,h;case 8:if((d.nodeValue||"").indexOf("DOCTYPE")!==0)return d=null,null;return h=["!",d.nodeValue],"function"==typeof e&&(h=e(h,d)),d=null,h;default:return d=null}},a.parseHTML=function(b,c){var d=document.createElement("div");d.innerHTML=b;var e=a.parseDOM(d,c);return d=null,e.length===2?e[1]:(e[0]="",e)}})(d),typeof c!==undefined&&c.exports&&(c.exports=d)},"external/jsonml/jsonml-jbst":function(a,b,c){var d=d||{};d.BST=function(){"use strict";function e(a,b){var c=a[b]||null;if(c){if("function"!=typeof c)try{c=new Function(String(c))}catch(d){c=null}c&&(a[b.split(":").join("$")]=c),delete a[b]}return c}function f(a){return"["+a+"]"}function g(a,b){b=b.split(":").join("$");var c=a[b];if(c)try{delete a[b]}catch(d){a[b]=undefined}return c}function h(a){var e=g(a,b);return"function"==typeof e&&e.call(a),e=g(a,c),"function"==typeof e&&setTimeout(function(){e.call(a),e=a=null},0),d.BST.filter?d.BST.filter(a):a}function i(a,b,c,d,e,f,g){try{return a.data="undefined"!=typeof b?b:null,a.index=isFinite(c)?Number(c):NaN,a.count=isFinite(d)?Number(d):NaN,a.args="undefined"!=typeof e?e:null,f.apply(a,g||[])}finally{delete a.count,delete a.index,delete a.data,delete a.args}}function j(g){function m(g,h,n,o,p){try{if(g){var q;if("function"==typeof g)return q=i(k,h,n,o,p,g),q instanceof j?q.dataBind(h,n,o,p):q;if(g instanceof Array){var r="function"==typeof d.BST.onbound&&d.BST.onbound,s="function"==typeof d.BST.onappend&&d.BST.onappend,t=s&&function(a,b){i(k,h,n,o,p,s,[a,b])};q=[];for(var u=0;u<g.length;u++){var v=m(g[u],h,n,o,p);l(q,v,t),!u&&!q[0]&&(s=t=null)}q[0]&&r&&i(k,h,n,o,p,r,[q]);if(d.hasAttributes(q)){var w=q[1][a];if("undefined"!=typeof w){if(!w)return"";delete q[1][a]}e(q[1],b),e(q[1],c)}return q}if("object"==typeof g){q={};for(var x in g)if(g.hasOwnProperty(x)){var y=m(g[x],h,n,o,p);"undefined"!=typeof y&&y!==null&&(q[x]=y)}return q}}return g}catch(z){try{var A="function"==typeof d.BST.onerror?d.BST.onerror:f;return i(k,h,n,o,p,A,[z])}catch(B){return"["+B+"]"}}}function n(a,b,c,d,e){if(b instanceof Array){var f=[""];d=b.length;for(var h=0;h<d;h++)l(f,m(g,b[h],h,d,e));return f}return m(g,b,c,d,e)}if("undefined"==typeof g)throw new Error("JBST tree is undefined");var k=this,l=d.appendChild;k.dataBind=function(a,b,c,d){return n(g,a,b,c,d)},k.bind=function(a,b,c,e){var f=n(g,a,b,c,e);return d.parse(f,h)},k.replace=function(a,b,c,d,e){"string"==typeof a&&(a=document.getElementById(a));if(a&&a.parentNode){var f=k.bind(b,c,d,e);f&&a.parentNode.replaceChild(f,a)}},k.displace=function(a,b,c,e,f,g){"string"==typeof a&&(a=document.getElementById(a));if(a&&a.parentNode){var i=n(b,c,e,f,g);i=d.parse(i,h),i&&a.parentNode.replaceChild(i,a)}},k.patch=function(a,b,c,e,f,g){"string"==typeof a&&(a=document.getElementById(a));if(a){var i=[""];l(i,m(b,c,e,f,g)),d.patch(a,i,h)}}}var a="jbst:visible",b="jbst:oninit",c="jbst:onload";return function(a){return a instanceof j?a:new j(a)}}(),d.BST.filter=null,d.BST.onerror=null,d.BST.onappend=null,d.BST.onbound=null},"external/jsonml/jsonml2":function(a,b,c){var d=d||{};(function(a){"use strict";function e(a,b,c){"string"==typeof c&&(c=new Function("event",c));if("function"!=typeof c)return;a[b]=c}function f(a,f){if(f.name&&document.attachEvent)try{var g=document.createElement("<"+a.tagName+' name="'+f.name+'">');a.tagName===g.tagName&&(a=g)}catch(h){}for(var i in f)if(f.hasOwnProperty(i)){var j=f[i];i&&j!==null&&"undefined"!=typeof j&&(i=b[i.toLowerCase()]||i,i==="style"?"undefined"!=typeof a.style.cssText?a.style.cssText=j:a.style=j:i==="class"?a.className=j:d[i]?(e(a,i,j),c[i]&&e(a,c[i],j)):"string"==typeof j||"number"==typeof j||"boolean"==typeof j?(a.setAttribute(i,j),c[i]&&a.setAttribute(c[i],j)):(a[i]=j,c[i]&&(a[c[i]]=j)))}return a}function g(a,b){if(b)if(a.tagName&&a.tagName.toLowerCase()==="table"&&a.tBodies){if(!b.tagName){if(b.nodeType===11)while(b.firstChild)g(a,b.removeChild(b.firstChild));return}var c=b.tagName.toLowerCase();if(c&&c!=="tbody"&&c!=="thead"){var d=a.tBodies.length>0?a.tBodies[a.tBodies.length-1]:null;d||(d=document.createElement(c==="th"?"thead":"tbody"),a.appendChild(d)),d.appendChild(b)}else a.canHaveChildren!==!1&&a.appendChild(b)}else if(a.tagName&&a.tagName.toLowerCase()==="style"&&document.createStyleSheet)a.cssText=b;else if(a.canHaveChildren!==!1)a.appendChild(b);else if(a.tagName&&a.tagName.toLowerCase()==="object"&&b.tagName&&b.tagName.toLowerCase()==="param"){try{a.appendChild(b)}catch(e){}try{a.object&&(a.object[b.name]=b.value)}catch(f){}}}function h(a){return a&&a.nodeType===3&&(!a.nodeValue||!/\S/.exec(a.nodeValue))}function i(a){if(a){while(h(a.firstChild))a.removeChild(a.firstChild);while(h(a.lastChild))a.removeChild(a.lastChild)}}function j(a){var b=document.createElement("div");b.innerHTML=a,i(b);if(b.childNodes.length===1)return b.firstChild;var c=document.createDocumentFragment?document.createDocumentFragment():document.createElement("");while(b.firstChild)c.appendChild(b.firstChild);return c}function k(a){this.value=a}function l(a,b,c){return document.createTextNode("["+a+"]")}function m(b,c,d){for(var e=1;e<c.length;e++)c[e]instanceof Array||"string"==typeof c[e]?g(b,a.parse(c[e],d)):c[e]instanceof k?g(b,j(c[e].value)):"object"==typeof c[e]&&c[e]!==null&&b.nodeType===1&&(b=f(b,c[e]));return b}var b={rowspan:"rowSpan",colspan:"colSpan",cellpadding:"cellPadding",cellspacing:"cellSpacing",tabindex:"tabIndex",accesskey:"accessKey",hidefocus:"hideFocus",usemap:"useMap",maxlength:"maxLength",readonly:"readOnly",contenteditable:"contentEditable"},c={enctype:"encoding",onscroll:"DOMMouseScroll"},d=function(a){var b={};while(a.length){var c=a.shift();b["on"+c.toLowerCase()]=c}return b}("blur,change,click,dblclick,error,focus,keydown,keypress,keyup,load,mousedown,mouseenter,mouseleave,mousemove,mouseout,mouseover,mouseup,resize,scroll,select,submit,unload".split(","));a.raw=function(a){return new k(a)},a.onerror=null,a.parse=function(b,c){try{if(!b)return null;if("string"==typeof b)return document.createTextNode(b);if(b instanceof k)return j(b.value);if(!a.isElement(b))throw new SyntaxError("invalid JsonML");var d=b[0];if(!d){var e=document.createDocumentFragment?document.createDocumentFragment():document.createElement("");for(var f=1;f<b.length;f++)g(e,a.parse(b[f],c));return i(e),e.childNodes.length===1?e.firstChild:e}if(d.toLowerCase()==="style"&&document.createStyleSheet)return a.patch(document.createStyleSheet(),b,c),null;var h=m(document.createElement(d),b,c);return i(h),h&&"function"==typeof c?c(h):h}catch(n){try{var o="function"==typeof a.onerror?a.onerror:l;return o(n,b,c)}catch(p){return document.createTextNode("["+p+"]")}}},a.patch=function(a,b,c){return m(a,b,c)},a.isElement=function(a){return a instanceof Array&&"string"==typeof a[0]},a.isFragment=function(a){return a instanceof Array&&a[0]===""},a.getTagName=function(a){return a[0]||""},a.isAttributes=function(a){return!!a&&"object"==typeof a&&!(a instanceof Array)},a.hasAttributes=function(b){if(!a.isElement(b))throw new SyntaxError("invalid JsonML");return a.isAttributes(b[1])},a.getAttributes=function(b,c){if(a.hasAttributes(b))return b[1];if(!c)return undefined;var d=b.shift(),e={};return b.unshift(e),b.unshift(d||""),e},a.addAttributes=function(b,c){if(!a.isElement
(b)||!a.isAttributes(c))throw new SyntaxError("invalid JsonML");if(!a.isAttributes(b[1])){var d=b.shift();b.unshift(c),b.unshift(d||"");return}var e=b[1];for(var f in c)c.hasOwnProperty(f)&&(e[f]=c[f])},a.getAttribute=function(b,c){return a.hasAttributes(b)?b[1][c]:undefined},a.setAttribute=function(b,c,d){a.getAttributes(b,!0)[c]=d},a.appendChild=function(b,c){if(c instanceof Array&&c[0]===""){c.shift();while(c.length)a.appendChild(b,c.shift(),arguments[2])}else if(c&&"object"==typeof c)if(c instanceof Array){if(!a.isElement(b)||!a.isElement(c))throw new SyntaxError("invalid JsonML");"function"==typeof arguments[2]&&arguments[2](b,c),b.push(c)}else if(c instanceof k){if(!a.isElement(b))throw new SyntaxError("invalid JsonML");b.push(c)}else a.addAttributes(b,c);else if("undefined"!=typeof c&&c!==null){if(!(b instanceof Array))throw new SyntaxError("invalid JsonML");c=String(c),c&&b.length>1&&"string"==typeof b[b.length-1]?b[b.length-1]+=c:(c||!b.length)&&b.push(c)}},a.getChildren=function(b){a.hasAttributes(b)&&b.slice(2),b.slice(1)}})(d)},"node/SCXML":function(a,b,c){function l(a,b){var c=i.parse(a);h.get(c,function(a){var c="";a.on("data",function(a){c+=a}),a.on("end",function(){var a=o(c);b(null,a)})}).on("error",function(a){b(a)})}function m(a,b){j.readFile(a,function(a,c){if(a)b(a);else{var d=o(c);b(null,d)}},"utf8")}function n(a){return(new k.DOMParser).parseFromString(a)}function o(a){return p(n(a))}function p(a){var b=e.parseDOM(a),c=b[1],d=f.transform(c),h=g(d);return h}var d=b("../core/scxml/SCXML"),e=b("../external/jsonml/jsonml-dom"),f=b("../core/util/annotate-scxml-json"),g=b("../core/scxml/json2model"),h=b("http"),i=b("url"),j=b("fs"),k=b("xmldom");d.SimpleInterpreter.prototype._setTimeout=setTimeout,d.SimpleInterpreter.prototype._clearTimeout=clearTimeout,d.SimpleInterpreter.prototype._log=console.log,c.exports={pathToModel:m,urlToModel:l,documentStringToModel:o,documentToModel:p,parseDocumentString:n,SCXML:d.SimpleInterpreter}},"node/browser-atom3-proxy":function(a,b,c){var d=b("http"),e=b("http-proxy"),f=b("node-static"),g=new f.Server(".");e.createServer(function(a,b,c){a.url==="/command"?c.proxyRequest(a,b,{host:"localhost",port:12345}):a.addListener("end",function(){g.serve(a,b)})}).listen(8e3)},"node/node-listener-client":function(a,b,c){function e(a){this.options=a;var b=new d.Agent;b.maxSockets=1,this.defaultOptions={host:"localhost",port:"1337",agent:b}}function f(a){for(var b=1;b<arguments.length;b++)for(var c in arguments[b]){var d=arguments[b][c];a[c]=d}}var d=b("http");e.prototype={onEntry:function(a){d.get(f({path:"/onEntry?id="+a},this.defaultOptions,this.options),function(a){})},onExit:function(a){d.get(f({path:"/onExit?id="+a},this.defaultOptions,this.options),function(a){})},onTransition:function(a,b){}},c.exports=e},"node/node-scxml-gui-http-proxy-server":function(a,b,c){var d=b("http"),e=b("url"),f=b("net"),g=process.argv.slice(2),h=g[0]||1337,i=g[1]||"localhost",j=parseInt(g[2],10)||9999,k=new f.Socket;k.connect(j,i,function(){}),k.on("error",function(a){console.log("Could not connect to service at host "+i+", port "+j),l&&l.close()}),k.on("data",function(a){console.log("received data from scxmlGUI socket",a)}),k.on("close",function(a){console.log("scxmlGUI socket closed unexpectedly"),l&&l.close()});var l=d.createServer(function(a,b){var c=e.parse(a.url,!0);switch(c.pathname){case"/onEntry":k.write("1 "+c.query.id+"\n");break;case"/onExit":k.write("0 "+c.query.id+"\n");break;case"/onTransition":break;default:b.writeHead(400,{"Content-Type":"text/plain"}),b.end("Unable to understand request\n");return}b.writeHead(200,{"Content-Type":"text/plain"}),b.end("Request processed\n")}).listen(h)},"rhino/SCXML":function(a,b,c){function h(a){for(var b in a)if(a.hasOwnProperty(b)){var c=a[b];c instanceof Packages.java.lang.String?a[b]=String(c):typeof c=="object"&&h(c)}}function i(){return Packages.javax.xml.parsers.DocumentBuilderFactory.newInstance().newDocumentBuilder()}function j(a,b){try{var c=i().parse(a);b(null,m(c))}catch(d){b(d)}}function k(a){var b=i(),c=new Packages.org.xml.sax.InputSource;return c.setCharacterStream(new Packages.java.io.StringReader(a)),b.parse(c)}function l(a){return m(k(a))}function m(a){var b=e.parseDOM(a);h(b);var c=b[1],d=f.transform(c),i=g(d);return i}var d=b("../core/scxml/SCXML"),e=b("../external/jsonml/jsonml-dom"),f=b("../core/util/annotate-scxml-json"),g=b("../core/scxml/json2model");(function(){var a=new Packages.java.util.Timer,b=1,c={};d.SimpleInterpreter.prototype._setTimeout=function(d,e){var f=b++;return c[f]=new Packages.java.util.TimerTask({run:d}),a.schedule(c[f],e),f},d.SimpleInterpreter.prototype._clearTimeout=function(b){c[b].cancel(),a.purge(),delete c[b]}})(),d.SimpleInterpreter.prototype._log=function(){for(var a=0;a<arguments.length;a++)Packages.java.lang.System.out.println(arguments[a])},c.exports={pathToModel:j,urlToModel:j,documentStringToModel:l,documentToModel:m,parseDocumentString:k,SCXML:d.SimpleInterpreter}},scion:function(a,b,c){function d(){return typeof Packages!="undefined"}function e(){return typeof process!="undefined"&&typeof c!="undefined"}function f(){return typeof window!="undefined"&&typeof document!="undefined"}d()?c.exports=b("./rhino/SCXML"):e()?c.exports=b("./node/SCXML"):f()?c.exports=b("./browser/SCXML"):c.exports={annotator:b("./util/annotate-scxml-json"),json2model:b("./scxml/json2model"),scxml:b("./scxml/SCXML")}}});