self.Tpl_cmd = {};//заполняется на клиенте, но есть и на сервере 
	Tpl_server.Tpl_cmd = {};//cc
self.Tpl_reqCmd = {};//cc

//??self.Tpl_$srcById = {};//client
self.Tpl_descrById = new Map();//cc
self.Tpl_idCurVal = 0;//cc

self.Tpl_cache = {};//auto
self.Tpl_scopeCache = {};//auto

self.Tpl_func = {};//auto

self.Tpl_varIdByVar = new Map();//auto
self.Tpl_varById = {};//auto
self.Tpl_varIdByVarIdByProp = {};//auto
self.Tpl_srcIdSetByVarId = new Map();//auto

self.Tpl_localScope = {};//auto
self.Tpl_loacIdCurVal = 0;//cc

//!!
//Tpl_server_objById = {};
Tpl_server.serializeIdxId = 0;
Tpl_server.objIdByObj = new Map();

Tpl_server.serialize = function() {
	let str = "Tpl_server_objById={};\nself.Tpl_varIdByVar=new Map();\nself.Tpl_varById={};\n";
	for (const n in self) {
		if (n != "Tpl_server" && n != "Tpl_varIdByVar" && n != "Tpl_varById") {
			str += Tpl_server._serializeSet(n, self[n], "self");
		}
	}
	return str;
}
Tpl_server._serializeSet = function(n, v, tName) {
	const vName = tName + (n !== "" ? Tpl_server.getPropStr(n) : "");
	switch (typeof(v)) {
		case "object":
			if (v === null) {
				return vName + "=null;\n";
			}
			const oId = Tpl_server.objIdByObj.get(v);
			if (oId != undefined) {
				return vName + "=Tpl_server_objById[" + oId + "];\n";
			}
			if (Array.isArray(v)) {
				let str += vName + "=[];\n" + Tpl_server.serializeAddObj(vName, ++Tpl_server.serializeIdxId);
				const l = v.length;
				for (let i = 0; i < l; i++) {
					const iName = vName + "[" + i + "]";
					str += Tpl_server._serializeSet(i, v[i], iName);
				}
				return str;
			}
			if (v instanceof Set) {
				let str += vName + "=new Set();\n" + Tpl_server.serializeAddObj(v, vName, ++Tpl_server.serializeIdxId);
				for (const i of v.values()) {
					const iName = "_i_" + vName;
					str += Tpl_server._serializeSet("", i, iName) + vName + ".add(" + iName+ ");\n";
				}
				return str;
			}
			if (v instanceof Map) {
				let str += vName + "=new Map();\n";
				for (const [key, val] of v) {
					const keyName = "_key_" + vName,
						valName = "_val_" + vName;
					str += Tpl_server._serializeSet("", key, keyName) + Tpl_server._serializeSet("", val, valName) + vName + ".set(" + keyName+ ", " + valName+ ");"\n;
				}
				return str;
			}
			if (v instanceof RegExp) {
				return vName + "=" + v.toString() + "\n";
			}
//todo maby eshe?
			let str = vName + "{};\n" + Tpl_server.serializeAddObj(v, vName, ++Tpl_server.serializeIdxId);
			for (const i in v) {
				const iName = vName + Tpl_server.getPropStr(i);
				str += Tpl_server._serializeSet(i, v[i], iName);
			}
			return str;
		case "number":
		case "boolean":
			return vName + "=" + v + "\n";
		case "string":
			return vName + "=\"" + v.replace(Tpl_server.qqGRe, '\\"') + "\";\n";
		case "function":
			return vName + "=" + v.toString() + ";\n";
		case "undefined":
			return vName + "=undefined;\n";
		default:
			return "";
	}
}
Tpl_server.serializeAddObj = function(o, oName, oId) {
	const vId = self.Tpl_varIdByVar.get(o);
	if (vId === undefined) {
		return "Tpl_server_objById[" + oId + "]=" + oName + ";\n";
	}
	return "Tpl_server_objById[" + oId + "]=" + oName + ";\nself.Tpl_varIdByVar.set(" + vId + ", " + oName + ");\nself.Tpl_varById[" + vId +"]=" + oName + ";\n";
}
Tpl_server.qqGRe = /\"/g;
Tpl_server.getPropStr = function(n) {
	return "[" + n.replace(Tpl_server.qqGRe, '\\"') + "]";
}
