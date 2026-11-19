// \0rolldown/runtime.js
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod, mod.exports), cb = null), mod.exports);
// node_modules/.pnpm/ajv@8.20.0/node_modules/ajv/dist/runtime/ucs2length.js
var require_ucs2length = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	function ucs2length(str) {
		const len = str.length;
		let length = 0;
		let pos = 0;
		let value;
		while (pos < len) {
			length++;
			value = str.charCodeAt(pos++);
			if (value >= 55296 && value <= 56319 && pos < len) {
				value = str.charCodeAt(pos);
				if ((value & 64512) === 56320) pos++;
			}
		}
		return length;
	}
	exports.default = ucs2length;
	ucs2length.code = "require(\"ajv/dist/runtime/ucs2length\").default";
}));
// generated/validators.raw.js
var validateAppSnapshotRequest = validate20;
var schema31 = {
	"$defs": { "DecimalString": {
		"maxLength": 19,
		"pattern": "^(0|[1-9][0-9]*)$",
		"type": "string"
	} },
	"$schema": "https://json-schema.org/draft/2020-12/schema",
	"additionalProperties": false,
	"properties": {
		"data_generation_id": {
			"default": null,
			"type": ["string", "null"]
		},
		"last_event_seq": {
			"anyOf": [{ "$ref": "#/$defs/DecimalString" }, { "type": "null" }],
			"default": null
		}
	},
	"title": "AppSnapshotRequest",
	"type": "object"
};
var func1 = require_ucs2length().default;
var pattern4 = /* @__PURE__ */ new RegExp("^(0|[1-9][0-9]*)$", "u");
function validate20(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate20.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			const _errs1 = errors;
			for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "last_event_seq")) {
				validate20.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (_errs1 === errors) {
				if (data.data_generation_id !== void 0) {
					let data0 = data.data_generation_id;
					const _errs2 = errors;
					if (typeof data0 !== "string" && data0 !== null) {
						validate20.errors = [{
							instancePath: instancePath + "/data_generation_id",
							schemaPath: "#/properties/data_generation_id/type",
							keyword: "type",
							params: { type: schema31.properties.data_generation_id.type },
							message: "must be string,null"
						}];
						return false;
					}
					var valid0 = _errs2 === errors;
				} else var valid0 = true;
				if (valid0) {
					if (data.last_event_seq !== void 0) {
						let data1 = data.last_event_seq;
						const _errs4 = errors;
						const _errs5 = errors;
						let valid1 = false;
						const _errs6 = errors;
						if (errors === errors) {
							if (typeof data1 === "string") {
								if (func1(data1) > 19) {
									const err0 = {
										instancePath: instancePath + "/last_event_seq",
										schemaPath: "#/$defs/DecimalString/maxLength",
										keyword: "maxLength",
										params: { limit: 19 },
										message: "must NOT have more than 19 characters"
									};
									if (vErrors === null) vErrors = [err0];
									else vErrors.push(err0);
									errors++;
								} else if (!pattern4.test(data1)) {
									const err1 = {
										instancePath: instancePath + "/last_event_seq",
										schemaPath: "#/$defs/DecimalString/pattern",
										keyword: "pattern",
										params: { pattern: "^(0|[1-9][0-9]*)$" },
										message: "must match pattern \"^(0|[1-9][0-9]*)$\""
									};
									if (vErrors === null) vErrors = [err1];
									else vErrors.push(err1);
									errors++;
								}
							} else {
								const err2 = {
									instancePath: instancePath + "/last_event_seq",
									schemaPath: "#/$defs/DecimalString/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								};
								if (vErrors === null) vErrors = [err2];
								else vErrors.push(err2);
								errors++;
							}
						}
						var _valid0 = _errs6 === errors;
						valid1 = valid1 || _valid0;
						const _errs9 = errors;
						if (data1 !== null) {
							const err3 = {
								instancePath: instancePath + "/last_event_seq",
								schemaPath: "#/properties/last_event_seq/anyOf/1/type",
								keyword: "type",
								params: { type: "null" },
								message: "must be null"
							};
							if (vErrors === null) vErrors = [err3];
							else vErrors.push(err3);
							errors++;
						}
						var _valid0 = _errs9 === errors;
						valid1 = valid1 || _valid0;
						if (!valid1) {
							const err4 = {
								instancePath: instancePath + "/last_event_seq",
								schemaPath: "#/properties/last_event_seq/anyOf",
								keyword: "anyOf",
								params: {},
								message: "must match a schema in anyOf"
							};
							if (vErrors === null) vErrors = [err4];
							else vErrors.push(err4);
							errors++;
							validate20.errors = vErrors;
							return false;
						} else {
							errors = _errs5;
							if (vErrors !== null) {
								if (_errs5) vErrors.length = _errs5;
								else vErrors = null;
							}
						}
						var valid0 = _errs4 === errors;
					} else var valid0 = true;
				}
			}
		} else {
			validate20.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate20.errors = vErrors;
	return errors === 0;
}
validate20.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateAppSnapshotResponse = validate21;
var schema43 = {
	"enum": ["0.3"],
	"type": "string"
};
var schema35 = {
	"additionalProperties": false,
	"properties": {
		"app_version": { "type": "string" },
		"appearance": { "$ref": "#/$defs/Appearance" },
		"data_directory": { "type": "string" },
		"data_generation_id": { "type": "string" },
		"events": {
			"items": { "$ref": "#/$defs/DomainEvent" },
			"type": "array"
		},
		"latest_event_seq": { "$ref": "#/$defs/DecimalString" },
		"latest_message_seq": { "$ref": "#/$defs/DecimalString" },
		"local_user": { "$ref": "#/$defs/Participant" },
		"participants": {
			"items": { "$ref": "#/$defs/Participant" },
			"type": "array"
		},
		"requires_full_reload": { "type": "boolean" },
		"room": { "$ref": "#/$defs/Room" }
	},
	"required": [
		"data_generation_id",
		"room",
		"local_user",
		"participants",
		"appearance",
		"latest_message_seq",
		"latest_event_seq",
		"events",
		"requires_full_reload",
		"data_directory",
		"app_version"
	],
	"type": "object"
};
var func2 = Object.prototype.hasOwnProperty;
var schema38 = {
	"enum": [
		"system",
		"light",
		"dark"
	],
	"type": "string"
};
function validate24(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate24.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.theme === void 0 && (missing0 = "theme") || data.reduce_motion === void 0 && (missing0 = "reduce_motion") || data.revision === void 0 && (missing0 = "revision")) {
			validate24.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "reduce_motion" || key0 === "revision" || key0 === "theme")) {
				validate24.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.reduce_motion !== void 0) {
				if (typeof data.reduce_motion !== "boolean") {
					validate24.errors = [{
						instancePath: instancePath + "/reduce_motion",
						schemaPath: "#/properties/reduce_motion/type",
						keyword: "type",
						params: { type: "boolean" },
						message: "must be boolean"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.revision !== void 0) {
					let data1 = data.revision;
					if (typeof data1 === "string") {
						if (func1(data1) > 19) {
							validate24.errors = [{
								instancePath: instancePath + "/revision",
								schemaPath: "#/$defs/DecimalString/maxLength",
								keyword: "maxLength",
								params: { limit: 19 },
								message: "must NOT have more than 19 characters"
							}];
							return false;
						} else if (!pattern4.test(data1)) {
							validate24.errors = [{
								instancePath: instancePath + "/revision",
								schemaPath: "#/$defs/DecimalString/pattern",
								keyword: "pattern",
								params: { pattern: "^(0|[1-9][0-9]*)$" },
								message: "must match pattern \"^(0|[1-9][0-9]*)$\""
							}];
							return false;
						}
					} else {
						validate24.errors = [{
							instancePath: instancePath + "/revision",
							schemaPath: "#/$defs/DecimalString/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.theme !== void 0) {
						let data2 = data.theme;
						if (typeof data2 !== "string") {
							validate24.errors = [{
								instancePath: instancePath + "/theme",
								schemaPath: "#/$defs/Theme/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "system" || data2 === "light" || data2 === "dark")) {
							validate24.errors = [{
								instancePath: instancePath + "/theme",
								schemaPath: "#/$defs/Theme/enum",
								keyword: "enum",
								params: { allowedValues: schema38.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
				}
			}
		}
	} else {
		validate24.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate24.errors = vErrors;
	return true;
}
validate24.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate27(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate27.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	let passing0 = null;
	const _errs1 = errors;
	if (errors === _errs1) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.kind === void 0 && (missing0 = "kind") || data.message_id === void 0 && (missing0 = "message_id") || data.message_seq === void 0 && (missing0 = "message_seq") || data.sender_id === void 0 && (missing0 = "sender_id")) {
				const err0 = {
					instancePath,
					schemaPath: "#/oneOf/0/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				};
				if (vErrors === null) vErrors = [err0];
				else vErrors.push(err0);
				errors++;
			} else {
				const _errs3 = errors;
				for (const key0 in data) if (!(key0 === "kind" || key0 === "message_id" || key0 === "message_seq" || key0 === "sender_id")) {
					const err1 = {
						instancePath,
						schemaPath: "#/oneOf/0/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					};
					if (vErrors === null) vErrors = [err1];
					else vErrors.push(err1);
					errors++;
					break;
				}
				if (_errs3 === errors) {
					if (data.kind !== void 0) {
						let data0 = data.kind;
						const _errs4 = errors;
						if (typeof data0 !== "string") {
							const err2 = {
								instancePath: instancePath + "/kind",
								schemaPath: "#/oneOf/0/properties/kind/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							};
							if (vErrors === null) vErrors = [err2];
							else vErrors.push(err2);
							errors++;
						}
						if ("message_committed" !== data0) {
							const err3 = {
								instancePath: instancePath + "/kind",
								schemaPath: "#/oneOf/0/properties/kind/const",
								keyword: "const",
								params: { allowedValue: "message_committed" },
								message: "must be equal to constant"
							};
							if (vErrors === null) vErrors = [err3];
							else vErrors.push(err3);
							errors++;
						}
						var valid1 = _errs4 === errors;
					} else var valid1 = true;
					if (valid1) {
						if (data.message_id !== void 0) {
							const _errs6 = errors;
							if (typeof data.message_id !== "string") {
								const err4 = {
									instancePath: instancePath + "/message_id",
									schemaPath: "#/oneOf/0/properties/message_id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								};
								if (vErrors === null) vErrors = [err4];
								else vErrors.push(err4);
								errors++;
							}
							var valid1 = _errs6 === errors;
						} else var valid1 = true;
						if (valid1) {
							if (data.message_seq !== void 0) {
								let data2 = data.message_seq;
								const _errs8 = errors;
								if (errors === errors) {
									if (typeof data2 === "string") {
										if (func1(data2) > 19) {
											const err5 = {
												instancePath: instancePath + "/message_seq",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											};
											if (vErrors === null) vErrors = [err5];
											else vErrors.push(err5);
											errors++;
										} else if (!pattern4.test(data2)) {
											const err6 = {
												instancePath: instancePath + "/message_seq",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											};
											if (vErrors === null) vErrors = [err6];
											else vErrors.push(err6);
											errors++;
										}
									} else {
										const err7 = {
											instancePath: instancePath + "/message_seq",
											schemaPath: "#/$defs/DecimalString/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										};
										if (vErrors === null) vErrors = [err7];
										else vErrors.push(err7);
										errors++;
									}
								}
								var valid1 = _errs8 === errors;
							} else var valid1 = true;
							if (valid1) {
								if (data.sender_id !== void 0) {
									const _errs11 = errors;
									if (typeof data.sender_id !== "string") {
										const err8 = {
											instancePath: instancePath + "/sender_id",
											schemaPath: "#/oneOf/0/properties/sender_id/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										};
										if (vErrors === null) vErrors = [err8];
										else vErrors.push(err8);
										errors++;
									}
									var valid1 = _errs11 === errors;
								} else var valid1 = true;
							}
						}
					}
				}
			}
		} else {
			const err9 = {
				instancePath,
				schemaPath: "#/oneOf/0/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			};
			if (vErrors === null) vErrors = [err9];
			else vErrors.push(err9);
			errors++;
		}
	}
	var _valid0 = _errs1 === errors;
	if (_valid0) {
		valid0 = true;
		passing0 = 0;
		var props0 = true;
	}
	const _errs13 = errors;
	if (errors === _errs13) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing1;
			if (data.kind === void 0 && (missing1 = "kind") || data.appearance === void 0 && (missing1 = "appearance")) {
				const err10 = {
					instancePath,
					schemaPath: "#/oneOf/1/required",
					keyword: "required",
					params: { missingProperty: missing1 },
					message: "must have required property '" + missing1 + "'"
				};
				if (vErrors === null) vErrors = [err10];
				else vErrors.push(err10);
				errors++;
			} else {
				const _errs15 = errors;
				for (const key1 in data) if (!(key1 === "appearance" || key1 === "kind")) {
					const err11 = {
						instancePath,
						schemaPath: "#/oneOf/1/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key1 },
						message: "must NOT have additional properties"
					};
					if (vErrors === null) vErrors = [err11];
					else vErrors.push(err11);
					errors++;
					break;
				}
				if (_errs15 === errors) {
					if (data.appearance !== void 0) {
						const _errs16 = errors;
						if (!validate24(data.appearance, {
							instancePath: instancePath + "/appearance",
							parentData: data,
							parentDataProperty: "appearance",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate24.errors : vErrors.concat(validate24.errors);
							errors = vErrors.length;
						}
						var valid3 = _errs16 === errors;
					} else var valid3 = true;
					if (valid3) {
						if (data.kind !== void 0) {
							let data5 = data.kind;
							const _errs17 = errors;
							if (typeof data5 !== "string") {
								const err12 = {
									instancePath: instancePath + "/kind",
									schemaPath: "#/oneOf/1/properties/kind/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								};
								if (vErrors === null) vErrors = [err12];
								else vErrors.push(err12);
								errors++;
							}
							if ("appearance_changed" !== data5) {
								const err13 = {
									instancePath: instancePath + "/kind",
									schemaPath: "#/oneOf/1/properties/kind/const",
									keyword: "const",
									params: { allowedValue: "appearance_changed" },
									message: "must be equal to constant"
								};
								if (vErrors === null) vErrors = [err13];
								else vErrors.push(err13);
								errors++;
							}
							var valid3 = _errs17 === errors;
						} else var valid3 = true;
					}
				}
			}
		} else {
			const err14 = {
				instancePath,
				schemaPath: "#/oneOf/1/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			};
			if (vErrors === null) vErrors = [err14];
			else vErrors.push(err14);
			errors++;
		}
	}
	var _valid0 = _errs13 === errors;
	if (_valid0 && valid0) {
		valid0 = false;
		passing0 = [passing0, 1];
	} else if (_valid0) {
		valid0 = true;
		passing0 = 1;
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err15 = {
			instancePath,
			schemaPath: "#/oneOf",
			keyword: "oneOf",
			params: { passingSchemas: passing0 },
			message: "must match exactly one schema in oneOf"
		};
		if (vErrors === null) vErrors = [err15];
		else vErrors.push(err15);
		errors++;
		validate27.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate27.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate27.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
function validate26(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate26.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.event_seq === void 0 && (missing0 = "event_seq") || data.event_id === void 0 && (missing0 = "event_id") || data.occurred_at === void 0 && (missing0 = "occurred_at") || data.payload === void 0 && (missing0 = "payload")) {
				validate26.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "event_id" || key0 === "event_seq" || key0 === "occurred_at" || key0 === "payload" || key0 === "schema_version")) {
					validate26.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.data_generation_id !== void 0) {
						const _errs2 = errors;
						if (typeof data.data_generation_id !== "string") {
							validate26.errors = [{
								instancePath: instancePath + "/data_generation_id",
								schemaPath: "#/properties/data_generation_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.event_id !== void 0) {
							const _errs4 = errors;
							if (typeof data.event_id !== "string") {
								validate26.errors = [{
									instancePath: instancePath + "/event_id",
									schemaPath: "#/properties/event_id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.event_seq !== void 0) {
								let data2 = data.event_seq;
								const _errs6 = errors;
								if (errors === errors) {
									if (typeof data2 === "string") {
										if (func1(data2) > 19) {
											validate26.errors = [{
												instancePath: instancePath + "/event_seq",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											}];
											return false;
										} else if (!pattern4.test(data2)) {
											validate26.errors = [{
												instancePath: instancePath + "/event_seq",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											}];
											return false;
										}
									} else {
										validate26.errors = [{
											instancePath: instancePath + "/event_seq",
											schemaPath: "#/$defs/DecimalString/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.occurred_at !== void 0) {
									let data3 = data.occurred_at;
									const _errs9 = errors;
									if (!(typeof data3 == "number" && !(data3 % 1) && !isNaN(data3) && isFinite(data3))) {
										validate26.errors = [{
											instancePath: instancePath + "/occurred_at",
											schemaPath: "#/properties/occurred_at/type",
											keyword: "type",
											params: { type: "integer" },
											message: "must be integer"
										}];
										return false;
									}
									if (errors === _errs9) {
										if (typeof data3 == "number" && isFinite(data3)) {
											if (data3 > 9007199254740991 || isNaN(data3)) {
												validate26.errors = [{
													instancePath: instancePath + "/occurred_at",
													schemaPath: "#/properties/occurred_at/maximum",
													keyword: "maximum",
													params: {
														comparison: "<=",
														limit: 9007199254740991
													},
													message: "must be <= 9007199254740991"
												}];
												return false;
											} else if (data3 < -9007199254740991 || isNaN(data3)) {
												validate26.errors = [{
													instancePath: instancePath + "/occurred_at",
													schemaPath: "#/properties/occurred_at/minimum",
													keyword: "minimum",
													params: {
														comparison: ">=",
														limit: -9007199254740991
													},
													message: "must be >= -9007199254740991"
												}];
												return false;
											}
										}
									}
									var valid0 = _errs9 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.payload !== void 0) {
										const _errs11 = errors;
										if (!validate27(data.payload, {
											instancePath: instancePath + "/payload",
											parentData: data,
											parentDataProperty: "payload",
											rootData,
											dynamicAnchors
										})) {
											vErrors = vErrors === null ? validate27.errors : vErrors.concat(validate27.errors);
											errors = vErrors.length;
										}
										var valid0 = _errs11 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.schema_version !== void 0) {
											let data5 = data.schema_version;
											const _errs12 = errors;
											if (typeof data5 !== "string") {
												validate26.errors = [{
													instancePath: instancePath + "/schema_version",
													schemaPath: "#/$defs/SchemaVersion/type",
													keyword: "type",
													params: { type: "string" },
													message: "must be string"
												}];
												return false;
											}
											if (!(data5 === "0.3")) {
												validate26.errors = [{
													instancePath: instancePath + "/schema_version",
													schemaPath: "#/$defs/SchemaVersion/enum",
													keyword: "enum",
													params: { allowedValues: schema43.enum },
													message: "must be equal to one of the allowed values"
												}];
												return false;
											}
											var valid0 = _errs12 === errors;
										} else var valid0 = true;
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate26.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate26.errors = vErrors;
	return errors === 0;
}
validate26.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema47 = {
	"enum": ["user", "agent"],
	"type": "string"
};
var schema48 = {
	"enum": ["present", "needs_configuration"],
	"type": "string"
};
function validate31(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate31.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.id === void 0 && (missing0 = "id") || data.kind === void 0 && (missing0 = "kind") || data.display_name === void 0 && (missing0 = "display_name") || data.introduction === void 0 && (missing0 = "introduction") || data.status === void 0 && (missing0 = "status") || data.is_builtin === void 0 && (missing0 = "is_builtin")) {
			validate31.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "display_name" || key0 === "id" || key0 === "introduction" || key0 === "is_builtin" || key0 === "kind" || key0 === "status")) {
				validate31.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.display_name !== void 0) {
				if (typeof data.display_name !== "string") {
					validate31.errors = [{
						instancePath: instancePath + "/display_name",
						schemaPath: "#/properties/display_name/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.id !== void 0) {
					if (typeof data.id !== "string") {
						validate31.errors = [{
							instancePath: instancePath + "/id",
							schemaPath: "#/properties/id/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.introduction !== void 0) {
						if (typeof data.introduction !== "string") {
							validate31.errors = [{
								instancePath: instancePath + "/introduction",
								schemaPath: "#/properties/introduction/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.is_builtin !== void 0) {
							if (typeof data.is_builtin !== "boolean") {
								validate31.errors = [{
									instancePath: instancePath + "/is_builtin",
									schemaPath: "#/properties/is_builtin/type",
									keyword: "type",
									params: { type: "boolean" },
									message: "must be boolean"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.kind !== void 0) {
								let data4 = data.kind;
								if (typeof data4 !== "string") {
									validate31.errors = [{
										instancePath: instancePath + "/kind",
										schemaPath: "#/$defs/ParticipantKind/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "user" || data4 === "agent")) {
									validate31.errors = [{
										instancePath: instancePath + "/kind",
										schemaPath: "#/$defs/ParticipantKind/enum",
										keyword: "enum",
										params: { allowedValues: schema47.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.status !== void 0) {
									let data5 = data.status;
									if (typeof data5 !== "string") {
										validate31.errors = [{
											instancePath: instancePath + "/status",
											schemaPath: "#/$defs/ParticipantStatus/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									if (!(data5 === "present" || data5 === "needs_configuration")) {
										validate31.errors = [{
											instancePath: instancePath + "/status",
											schemaPath: "#/$defs/ParticipantStatus/enum",
											keyword: "enum",
											params: { allowedValues: schema48.enum },
											message: "must be equal to one of the allowed values"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate31.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate31.errors = vErrors;
	return true;
}
validate31.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate34(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate34.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.owner_participant_id === void 0 && (missing0 = "owner_participant_id") || data.version === void 0 && (missing0 = "version") || data.content_epoch === void 0 && (missing0 = "content_epoch")) {
			validate34.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "content_epoch" || key0 === "id" || key0 === "name" || key0 === "owner_participant_id" || key0 === "version")) {
				validate34.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.content_epoch !== void 0) {
				let data0 = data.content_epoch;
				if (typeof data0 === "string") {
					if (func1(data0) > 19) {
						validate34.errors = [{
							instancePath: instancePath + "/content_epoch",
							schemaPath: "#/$defs/DecimalString/maxLength",
							keyword: "maxLength",
							params: { limit: 19 },
							message: "must NOT have more than 19 characters"
						}];
						return false;
					} else if (!pattern4.test(data0)) {
						validate34.errors = [{
							instancePath: instancePath + "/content_epoch",
							schemaPath: "#/$defs/DecimalString/pattern",
							keyword: "pattern",
							params: { pattern: "^(0|[1-9][0-9]*)$" },
							message: "must match pattern \"^(0|[1-9][0-9]*)$\""
						}];
						return false;
					}
				} else {
					validate34.errors = [{
						instancePath: instancePath + "/content_epoch",
						schemaPath: "#/$defs/DecimalString/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.id !== void 0) {
					if (typeof data.id !== "string") {
						validate34.errors = [{
							instancePath: instancePath + "/id",
							schemaPath: "#/properties/id/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.name !== void 0) {
						if (typeof data.name !== "string") {
							validate34.errors = [{
								instancePath: instancePath + "/name",
								schemaPath: "#/properties/name/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.owner_participant_id !== void 0) {
							if (typeof data.owner_participant_id !== "string") {
								validate34.errors = [{
									instancePath: instancePath + "/owner_participant_id",
									schemaPath: "#/properties/owner_participant_id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.version !== void 0) {
								let data4 = data.version;
								if (typeof data4 === "string") {
									if (func1(data4) > 19) {
										validate34.errors = [{
											instancePath: instancePath + "/version",
											schemaPath: "#/$defs/DecimalString/maxLength",
											keyword: "maxLength",
											params: { limit: 19 },
											message: "must NOT have more than 19 characters"
										}];
										return false;
									} else if (!pattern4.test(data4)) {
										validate34.errors = [{
											instancePath: instancePath + "/version",
											schemaPath: "#/$defs/DecimalString/pattern",
											keyword: "pattern",
											params: { pattern: "^(0|[1-9][0-9]*)$" },
											message: "must match pattern \"^(0|[1-9][0-9]*)$\""
										}];
										return false;
									}
								} else {
									validate34.errors = [{
										instancePath: instancePath + "/version",
										schemaPath: "#/$defs/DecimalString/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
						}
					}
				}
			}
		}
	} else {
		validate34.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate34.errors = vErrors;
	return true;
}
validate34.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate23(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate23.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.room === void 0 && (missing0 = "room") || data.local_user === void 0 && (missing0 = "local_user") || data.participants === void 0 && (missing0 = "participants") || data.appearance === void 0 && (missing0 = "appearance") || data.latest_message_seq === void 0 && (missing0 = "latest_message_seq") || data.latest_event_seq === void 0 && (missing0 = "latest_event_seq") || data.events === void 0 && (missing0 = "events") || data.requires_full_reload === void 0 && (missing0 = "requires_full_reload") || data.data_directory === void 0 && (missing0 = "data_directory") || data.app_version === void 0 && (missing0 = "app_version")) {
				validate23.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!func2.call(schema35.properties, key0)) {
					validate23.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.app_version !== void 0) {
						const _errs2 = errors;
						if (typeof data.app_version !== "string") {
							validate23.errors = [{
								instancePath: instancePath + "/app_version",
								schemaPath: "#/properties/app_version/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.appearance !== void 0) {
							const _errs4 = errors;
							if (!validate24(data.appearance, {
								instancePath: instancePath + "/appearance",
								parentData: data,
								parentDataProperty: "appearance",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate24.errors : vErrors.concat(validate24.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.data_directory !== void 0) {
								const _errs5 = errors;
								if (typeof data.data_directory !== "string") {
									validate23.errors = [{
										instancePath: instancePath + "/data_directory",
										schemaPath: "#/properties/data_directory/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = _errs5 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.data_generation_id !== void 0) {
									const _errs7 = errors;
									if (typeof data.data_generation_id !== "string") {
										validate23.errors = [{
											instancePath: instancePath + "/data_generation_id",
											schemaPath: "#/properties/data_generation_id/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = _errs7 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.events !== void 0) {
										let data4 = data.events;
										const _errs9 = errors;
										if (errors === _errs9) {
											if (Array.isArray(data4)) {
												const len0 = data4.length;
												for (let i0 = 0; i0 < len0; i0++) {
													const _errs11 = errors;
													if (!validate26(data4[i0], {
														instancePath: instancePath + "/events/" + i0,
														parentData: data4,
														parentDataProperty: i0,
														rootData,
														dynamicAnchors
													})) {
														vErrors = vErrors === null ? validate26.errors : vErrors.concat(validate26.errors);
														errors = vErrors.length;
													}
													if (!(_errs11 === errors)) break;
												}
											} else {
												validate23.errors = [{
													instancePath: instancePath + "/events",
													schemaPath: "#/properties/events/type",
													keyword: "type",
													params: { type: "array" },
													message: "must be array"
												}];
												return false;
											}
										}
										var valid0 = _errs9 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.latest_event_seq !== void 0) {
											let data6 = data.latest_event_seq;
											const _errs12 = errors;
											if (errors === errors) {
												if (typeof data6 === "string") {
													if (func1(data6) > 19) {
														validate23.errors = [{
															instancePath: instancePath + "/latest_event_seq",
															schemaPath: "#/$defs/DecimalString/maxLength",
															keyword: "maxLength",
															params: { limit: 19 },
															message: "must NOT have more than 19 characters"
														}];
														return false;
													} else if (!pattern4.test(data6)) {
														validate23.errors = [{
															instancePath: instancePath + "/latest_event_seq",
															schemaPath: "#/$defs/DecimalString/pattern",
															keyword: "pattern",
															params: { pattern: "^(0|[1-9][0-9]*)$" },
															message: "must match pattern \"^(0|[1-9][0-9]*)$\""
														}];
														return false;
													}
												} else {
													validate23.errors = [{
														instancePath: instancePath + "/latest_event_seq",
														schemaPath: "#/$defs/DecimalString/type",
														keyword: "type",
														params: { type: "string" },
														message: "must be string"
													}];
													return false;
												}
											}
											var valid0 = _errs12 === errors;
										} else var valid0 = true;
										if (valid0) {
											if (data.latest_message_seq !== void 0) {
												let data7 = data.latest_message_seq;
												const _errs15 = errors;
												if (errors === errors) {
													if (typeof data7 === "string") {
														if (func1(data7) > 19) {
															validate23.errors = [{
																instancePath: instancePath + "/latest_message_seq",
																schemaPath: "#/$defs/DecimalString/maxLength",
																keyword: "maxLength",
																params: { limit: 19 },
																message: "must NOT have more than 19 characters"
															}];
															return false;
														} else if (!pattern4.test(data7)) {
															validate23.errors = [{
																instancePath: instancePath + "/latest_message_seq",
																schemaPath: "#/$defs/DecimalString/pattern",
																keyword: "pattern",
																params: { pattern: "^(0|[1-9][0-9]*)$" },
																message: "must match pattern \"^(0|[1-9][0-9]*)$\""
															}];
															return false;
														}
													} else {
														validate23.errors = [{
															instancePath: instancePath + "/latest_message_seq",
															schemaPath: "#/$defs/DecimalString/type",
															keyword: "type",
															params: { type: "string" },
															message: "must be string"
														}];
														return false;
													}
												}
												var valid0 = _errs15 === errors;
											} else var valid0 = true;
											if (valid0) {
												if (data.local_user !== void 0) {
													const _errs18 = errors;
													if (!validate31(data.local_user, {
														instancePath: instancePath + "/local_user",
														parentData: data,
														parentDataProperty: "local_user",
														rootData,
														dynamicAnchors
													})) {
														vErrors = vErrors === null ? validate31.errors : vErrors.concat(validate31.errors);
														errors = vErrors.length;
													}
													var valid0 = _errs18 === errors;
												} else var valid0 = true;
												if (valid0) {
													if (data.participants !== void 0) {
														let data9 = data.participants;
														const _errs19 = errors;
														if (errors === _errs19) {
															if (Array.isArray(data9)) {
																const len1 = data9.length;
																for (let i1 = 0; i1 < len1; i1++) {
																	const _errs21 = errors;
																	if (!validate31(data9[i1], {
																		instancePath: instancePath + "/participants/" + i1,
																		parentData: data9,
																		parentDataProperty: i1,
																		rootData,
																		dynamicAnchors
																	})) {
																		vErrors = vErrors === null ? validate31.errors : vErrors.concat(validate31.errors);
																		errors = vErrors.length;
																	}
																	if (!(_errs21 === errors)) break;
																}
															} else {
																validate23.errors = [{
																	instancePath: instancePath + "/participants",
																	schemaPath: "#/properties/participants/type",
																	keyword: "type",
																	params: { type: "array" },
																	message: "must be array"
																}];
																return false;
															}
														}
														var valid0 = _errs19 === errors;
													} else var valid0 = true;
													if (valid0) {
														if (data.requires_full_reload !== void 0) {
															const _errs22 = errors;
															if (typeof data.requires_full_reload !== "boolean") {
																validate23.errors = [{
																	instancePath: instancePath + "/requires_full_reload",
																	schemaPath: "#/properties/requires_full_reload/type",
																	keyword: "type",
																	params: { type: "boolean" },
																	message: "must be boolean"
																}];
																return false;
															}
															var valid0 = _errs22 === errors;
														} else var valid0 = true;
														if (valid0) {
															if (data.room !== void 0) {
																const _errs24 = errors;
																if (!validate34(data.room, {
																	instancePath: instancePath + "/room",
																	parentData: data,
																	parentDataProperty: "room",
																	rootData,
																	dynamicAnchors
																})) {
																	vErrors = vErrors === null ? validate34.errors : vErrors.concat(validate34.errors);
																	errors = vErrors.length;
																}
																var valid0 = _errs24 === errors;
															} else var valid0 = true;
														}
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate23.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate23.errors = vErrors;
	return errors === 0;
}
validate23.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate22(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate22.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate22.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "data" || key0 === "schema_version")) {
					validate22.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.data !== void 0) {
						const _errs2 = errors;
						if (!validate23(data.data, {
							instancePath: instancePath + "/data",
							parentData: data,
							parentDataProperty: "data",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate22.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate22.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema43.enum },
									message: "must be equal to one of the allowed values"
								}];
								return false;
							}
							var valid0 = _errs3 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate22.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate22.errors = vErrors;
	return errors === 0;
}
validate22.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema54 = {
	"additionalProperties": false,
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"field_path": { "type": ["string", "null"] },
		"may_have_been_charged": { "type": "boolean" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"trace_id": { "type": "string" }
	},
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	],
	"type": "object"
};
var schema55 = {
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	],
	"type": "string"
};
var schema56 = {
	"enum": [
		"never",
		"retry",
		"after_user_action"
	],
	"type": "string"
};
function validate39(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate39.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate39.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "field_path" || key0 === "may_have_been_charged" || key0 === "message" || key0 === "retryability" || key0 === "trace_id")) {
				validate39.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate39.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate39.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema55.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.field_path !== void 0) {
					let data1 = data.field_path;
					if (typeof data1 !== "string" && data1 !== null) {
						validate39.errors = [{
							instancePath: instancePath + "/field_path",
							schemaPath: "#/properties/field_path/type",
							keyword: "type",
							params: { type: schema54.properties.field_path.type },
							message: "must be string,null"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.may_have_been_charged !== void 0) {
						if (typeof data.may_have_been_charged !== "boolean") {
							validate39.errors = [{
								instancePath: instancePath + "/may_have_been_charged",
								schemaPath: "#/properties/may_have_been_charged/type",
								keyword: "type",
								params: { type: "boolean" },
								message: "must be boolean"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.message !== void 0) {
							if (typeof data.message !== "string") {
								validate39.errors = [{
									instancePath: instancePath + "/message",
									schemaPath: "#/properties/message/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.retryability !== void 0) {
								let data4 = data.retryability;
								if (typeof data4 !== "string") {
									validate39.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "never" || data4 === "retry" || data4 === "after_user_action")) {
									validate39.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/enum",
										keyword: "enum",
										params: { allowedValues: schema56.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.trace_id !== void 0) {
									if (typeof data.trace_id !== "string") {
										validate39.errors = [{
											instancePath: instancePath + "/trace_id",
											schemaPath: "#/properties/trace_id/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate39.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate39.errors = vErrors;
	return true;
}
validate39.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate38(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate38.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate38.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "error" || key0 === "schema_version")) {
					validate38.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.error !== void 0) {
						const _errs2 = errors;
						if (!validate39(data.error, {
							instancePath: instancePath + "/error",
							parentData: data,
							parentDataProperty: "error",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate39.errors : vErrors.concat(validate39.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate38.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate38.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema43.enum },
									message: "must be equal to one of the allowed values"
								}];
								return false;
							}
							var valid0 = _errs3 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate38.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate38.errors = vErrors;
	return errors === 0;
}
validate38.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate21(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate21.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate22(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate22.errors : vErrors.concat(validate22.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate38(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate38.errors : vErrors.concat(validate38.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate21.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate21.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate21.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateAppearanceSaveRequest = validate42;
var schema60 = {
	"enum": [
		"system",
		"light",
		"dark"
	],
	"type": "string"
};
function validate42(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate42.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.client_request_id === void 0 && (missing0 = "client_request_id") || data.expected_revision === void 0 && (missing0 = "expected_revision") || data.theme === void 0 && (missing0 = "theme") || data.reduce_motion === void 0 && (missing0 = "reduce_motion")) {
			validate42.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "client_request_id" || key0 === "data_generation_id" || key0 === "expected_revision" || key0 === "reduce_motion" || key0 === "theme")) {
				validate42.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.client_request_id !== void 0) {
				if (typeof data.client_request_id !== "string") {
					validate42.errors = [{
						instancePath: instancePath + "/client_request_id",
						schemaPath: "#/properties/client_request_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.data_generation_id !== void 0) {
					if (typeof data.data_generation_id !== "string") {
						validate42.errors = [{
							instancePath: instancePath + "/data_generation_id",
							schemaPath: "#/properties/data_generation_id/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.expected_revision !== void 0) {
						let data2 = data.expected_revision;
						if (typeof data2 === "string") {
							if (func1(data2) > 19) {
								validate42.errors = [{
									instancePath: instancePath + "/expected_revision",
									schemaPath: "#/$defs/DecimalString/maxLength",
									keyword: "maxLength",
									params: { limit: 19 },
									message: "must NOT have more than 19 characters"
								}];
								return false;
							} else if (!pattern4.test(data2)) {
								validate42.errors = [{
									instancePath: instancePath + "/expected_revision",
									schemaPath: "#/$defs/DecimalString/pattern",
									keyword: "pattern",
									params: { pattern: "^(0|[1-9][0-9]*)$" },
									message: "must match pattern \"^(0|[1-9][0-9]*)$\""
								}];
								return false;
							}
						} else {
							validate42.errors = [{
								instancePath: instancePath + "/expected_revision",
								schemaPath: "#/$defs/DecimalString/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.reduce_motion !== void 0) {
							if (typeof data.reduce_motion !== "boolean") {
								validate42.errors = [{
									instancePath: instancePath + "/reduce_motion",
									schemaPath: "#/properties/reduce_motion/type",
									keyword: "type",
									params: { type: "boolean" },
									message: "must be boolean"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.theme !== void 0) {
								let data4 = data.theme;
								if (typeof data4 !== "string") {
									validate42.errors = [{
										instancePath: instancePath + "/theme",
										schemaPath: "#/$defs/Theme/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "system" || data4 === "light" || data4 === "dark")) {
									validate42.errors = [{
										instancePath: instancePath + "/theme",
										schemaPath: "#/$defs/Theme/enum",
										keyword: "enum",
										params: { allowedValues: schema60.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
						}
					}
				}
			}
		}
	} else {
		validate42.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate42.errors = vErrors;
	return true;
}
validate42.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateAppearanceSaveResponse = validate43;
var schema66 = {
	"enum": ["0.3"],
	"type": "string"
};
var schema65 = {
	"enum": [
		"system",
		"light",
		"dark"
	],
	"type": "string"
};
function validate45(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate45.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.theme === void 0 && (missing0 = "theme") || data.reduce_motion === void 0 && (missing0 = "reduce_motion") || data.revision === void 0 && (missing0 = "revision")) {
			validate45.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "reduce_motion" || key0 === "revision" || key0 === "theme")) {
				validate45.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.reduce_motion !== void 0) {
				if (typeof data.reduce_motion !== "boolean") {
					validate45.errors = [{
						instancePath: instancePath + "/reduce_motion",
						schemaPath: "#/properties/reduce_motion/type",
						keyword: "type",
						params: { type: "boolean" },
						message: "must be boolean"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.revision !== void 0) {
					let data1 = data.revision;
					if (typeof data1 === "string") {
						if (func1(data1) > 19) {
							validate45.errors = [{
								instancePath: instancePath + "/revision",
								schemaPath: "#/$defs/DecimalString/maxLength",
								keyword: "maxLength",
								params: { limit: 19 },
								message: "must NOT have more than 19 characters"
							}];
							return false;
						} else if (!pattern4.test(data1)) {
							validate45.errors = [{
								instancePath: instancePath + "/revision",
								schemaPath: "#/$defs/DecimalString/pattern",
								keyword: "pattern",
								params: { pattern: "^(0|[1-9][0-9]*)$" },
								message: "must match pattern \"^(0|[1-9][0-9]*)$\""
							}];
							return false;
						}
					} else {
						validate45.errors = [{
							instancePath: instancePath + "/revision",
							schemaPath: "#/$defs/DecimalString/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.theme !== void 0) {
						let data2 = data.theme;
						if (typeof data2 !== "string") {
							validate45.errors = [{
								instancePath: instancePath + "/theme",
								schemaPath: "#/$defs/Theme/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "system" || data2 === "light" || data2 === "dark")) {
							validate45.errors = [{
								instancePath: instancePath + "/theme",
								schemaPath: "#/$defs/Theme/enum",
								keyword: "enum",
								params: { allowedValues: schema65.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
				}
			}
		}
	} else {
		validate45.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate45.errors = vErrors;
	return true;
}
validate45.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate44(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate44.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate44.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "data" || key0 === "schema_version")) {
					validate44.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.data !== void 0) {
						const _errs2 = errors;
						if (!validate45(data.data, {
							instancePath: instancePath + "/data",
							parentData: data,
							parentDataProperty: "data",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate45.errors : vErrors.concat(validate45.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate44.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate44.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema66.enum },
									message: "must be equal to one of the allowed values"
								}];
								return false;
							}
							var valid0 = _errs3 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate44.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate44.errors = vErrors;
	return errors === 0;
}
validate44.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema68 = {
	"additionalProperties": false,
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"field_path": { "type": ["string", "null"] },
		"may_have_been_charged": { "type": "boolean" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"trace_id": { "type": "string" }
	},
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	],
	"type": "object"
};
var schema69 = {
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	],
	"type": "string"
};
var schema70 = {
	"enum": [
		"never",
		"retry",
		"after_user_action"
	],
	"type": "string"
};
function validate49(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate49.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate49.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "field_path" || key0 === "may_have_been_charged" || key0 === "message" || key0 === "retryability" || key0 === "trace_id")) {
				validate49.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate49.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate49.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema69.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.field_path !== void 0) {
					let data1 = data.field_path;
					if (typeof data1 !== "string" && data1 !== null) {
						validate49.errors = [{
							instancePath: instancePath + "/field_path",
							schemaPath: "#/properties/field_path/type",
							keyword: "type",
							params: { type: schema68.properties.field_path.type },
							message: "must be string,null"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.may_have_been_charged !== void 0) {
						if (typeof data.may_have_been_charged !== "boolean") {
							validate49.errors = [{
								instancePath: instancePath + "/may_have_been_charged",
								schemaPath: "#/properties/may_have_been_charged/type",
								keyword: "type",
								params: { type: "boolean" },
								message: "must be boolean"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.message !== void 0) {
							if (typeof data.message !== "string") {
								validate49.errors = [{
									instancePath: instancePath + "/message",
									schemaPath: "#/properties/message/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.retryability !== void 0) {
								let data4 = data.retryability;
								if (typeof data4 !== "string") {
									validate49.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "never" || data4 === "retry" || data4 === "after_user_action")) {
									validate49.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/enum",
										keyword: "enum",
										params: { allowedValues: schema70.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.trace_id !== void 0) {
									if (typeof data.trace_id !== "string") {
										validate49.errors = [{
											instancePath: instancePath + "/trace_id",
											schemaPath: "#/properties/trace_id/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate49.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate49.errors = vErrors;
	return true;
}
validate49.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate48(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate48.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate48.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "error" || key0 === "schema_version")) {
					validate48.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.error !== void 0) {
						const _errs2 = errors;
						if (!validate49(data.error, {
							instancePath: instancePath + "/error",
							parentData: data,
							parentDataProperty: "error",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate49.errors : vErrors.concat(validate49.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate48.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate48.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema66.enum },
									message: "must be equal to one of the allowed values"
								}];
								return false;
							}
							var valid0 = _errs3 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate48.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate48.errors = vErrors;
	return errors === 0;
}
validate48.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate43(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate43.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate44(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate44.errors : vErrors.concat(validate44.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate48(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate48.errors : vErrors.concat(validate48.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate43.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate43.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate43.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateCancelSearchRequest = validate52;
function validate52(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate52.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.search_id === void 0 && (missing0 = "search_id")) {
			validate52.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "search_id")) {
				validate52.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.data_generation_id !== void 0) {
				if (typeof data.data_generation_id !== "string") {
					validate52.errors = [{
						instancePath: instancePath + "/data_generation_id",
						schemaPath: "#/properties/data_generation_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.search_id !== void 0) {
					if (typeof data.search_id !== "string") {
						validate52.errors = [{
							instancePath: instancePath + "/search_id",
							schemaPath: "#/properties/search_id/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
			}
		}
	} else {
		validate52.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate52.errors = vErrors;
	return true;
}
validate52.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateCancelSearchResponse = validate53;
var schema76 = {
	"enum": ["0.3"],
	"type": "string"
};
function validate54(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate54.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
			validate54.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data" || key0 === "schema_version")) {
				validate54.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.data !== void 0) {
				let data0 = data.data;
				if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
					let missing1;
					if (data0.search_id === void 0 && (missing1 = "search_id") || data0.cancellation_requested === void 0 && (missing1 = "cancellation_requested")) {
						validate54.errors = [{
							instancePath: instancePath + "/data",
							schemaPath: "#/$defs/CancelSearchResult/required",
							keyword: "required",
							params: { missingProperty: missing1 },
							message: "must have required property '" + missing1 + "'"
						}];
						return false;
					} else {
						for (const key1 in data0) if (!(key1 === "cancellation_requested" || key1 === "search_id")) {
							validate54.errors = [{
								instancePath: instancePath + "/data",
								schemaPath: "#/$defs/CancelSearchResult/additionalProperties",
								keyword: "additionalProperties",
								params: { additionalProperty: key1 },
								message: "must NOT have additional properties"
							}];
							return false;
						}
						if (data0.cancellation_requested !== void 0) {
							if (typeof data0.cancellation_requested !== "boolean") {
								validate54.errors = [{
									instancePath: instancePath + "/data/cancellation_requested",
									schemaPath: "#/$defs/CancelSearchResult/properties/cancellation_requested/type",
									keyword: "type",
									params: { type: "boolean" },
									message: "must be boolean"
								}];
								return false;
							}
							var valid2 = true;
						} else var valid2 = true;
						if (valid2) {
							if (data0.search_id !== void 0) {
								if (typeof data0.search_id !== "string") {
									validate54.errors = [{
										instancePath: instancePath + "/data/search_id",
										schemaPath: "#/$defs/CancelSearchResult/properties/search_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid2 = true;
							} else var valid2 = true;
						}
					}
				} else {
					validate54.errors = [{
						instancePath: instancePath + "/data",
						schemaPath: "#/$defs/CancelSearchResult/type",
						keyword: "type",
						params: { type: "object" },
						message: "must be object"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.schema_version !== void 0) {
					let data3 = data.schema_version;
					if (typeof data3 !== "string") {
						validate54.errors = [{
							instancePath: instancePath + "/schema_version",
							schemaPath: "#/$defs/SchemaVersion/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					if (!(data3 === "0.3")) {
						validate54.errors = [{
							instancePath: instancePath + "/schema_version",
							schemaPath: "#/$defs/SchemaVersion/enum",
							keyword: "enum",
							params: { allowedValues: schema76.enum },
							message: "must be equal to one of the allowed values"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
			}
		}
	} else {
		validate54.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate54.errors = vErrors;
	return true;
}
validate54.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema78 = {
	"additionalProperties": false,
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"field_path": { "type": ["string", "null"] },
		"may_have_been_charged": { "type": "boolean" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"trace_id": { "type": "string" }
	},
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	],
	"type": "object"
};
var schema79 = {
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	],
	"type": "string"
};
var schema80 = {
	"enum": [
		"never",
		"retry",
		"after_user_action"
	],
	"type": "string"
};
function validate57(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate57.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate57.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "field_path" || key0 === "may_have_been_charged" || key0 === "message" || key0 === "retryability" || key0 === "trace_id")) {
				validate57.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate57.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate57.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema79.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.field_path !== void 0) {
					let data1 = data.field_path;
					if (typeof data1 !== "string" && data1 !== null) {
						validate57.errors = [{
							instancePath: instancePath + "/field_path",
							schemaPath: "#/properties/field_path/type",
							keyword: "type",
							params: { type: schema78.properties.field_path.type },
							message: "must be string,null"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.may_have_been_charged !== void 0) {
						if (typeof data.may_have_been_charged !== "boolean") {
							validate57.errors = [{
								instancePath: instancePath + "/may_have_been_charged",
								schemaPath: "#/properties/may_have_been_charged/type",
								keyword: "type",
								params: { type: "boolean" },
								message: "must be boolean"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.message !== void 0) {
							if (typeof data.message !== "string") {
								validate57.errors = [{
									instancePath: instancePath + "/message",
									schemaPath: "#/properties/message/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.retryability !== void 0) {
								let data4 = data.retryability;
								if (typeof data4 !== "string") {
									validate57.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "never" || data4 === "retry" || data4 === "after_user_action")) {
									validate57.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/enum",
										keyword: "enum",
										params: { allowedValues: schema80.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.trace_id !== void 0) {
									if (typeof data.trace_id !== "string") {
										validate57.errors = [{
											instancePath: instancePath + "/trace_id",
											schemaPath: "#/properties/trace_id/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate57.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate57.errors = vErrors;
	return true;
}
validate57.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate56(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate56.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate56.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "error" || key0 === "schema_version")) {
					validate56.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.error !== void 0) {
						const _errs2 = errors;
						if (!validate57(data.error, {
							instancePath: instancePath + "/error",
							parentData: data,
							parentDataProperty: "error",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate57.errors : vErrors.concat(validate57.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate56.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate56.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema76.enum },
									message: "must be equal to one of the allowed values"
								}];
								return false;
							}
							var valid0 = _errs3 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate56.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate56.errors = vErrors;
	return errors === 0;
}
validate56.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate53(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate53.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate54(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate54.errors : vErrors.concat(validate54.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate56(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate56.errors : vErrors.concat(validate56.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate53.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate53.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate53.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateChatListRequest = validate60;
function validate60(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate60.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.limit === void 0 && (missing0 = "limit")) {
				validate60.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "after_seq" || key0 === "around_seq" || key0 === "before_seq" || key0 === "data_generation_id" || key0 === "limit")) {
					validate60.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.after_seq !== void 0) {
						let data0 = data.after_seq;
						const _errs2 = errors;
						const _errs3 = errors;
						let valid1 = false;
						const _errs4 = errors;
						if (errors === errors) {
							if (typeof data0 === "string") {
								if (func1(data0) > 19) {
									const err0 = {
										instancePath: instancePath + "/after_seq",
										schemaPath: "#/$defs/DecimalString/maxLength",
										keyword: "maxLength",
										params: { limit: 19 },
										message: "must NOT have more than 19 characters"
									};
									if (vErrors === null) vErrors = [err0];
									else vErrors.push(err0);
									errors++;
								} else if (!pattern4.test(data0)) {
									const err1 = {
										instancePath: instancePath + "/after_seq",
										schemaPath: "#/$defs/DecimalString/pattern",
										keyword: "pattern",
										params: { pattern: "^(0|[1-9][0-9]*)$" },
										message: "must match pattern \"^(0|[1-9][0-9]*)$\""
									};
									if (vErrors === null) vErrors = [err1];
									else vErrors.push(err1);
									errors++;
								}
							} else {
								const err2 = {
									instancePath: instancePath + "/after_seq",
									schemaPath: "#/$defs/DecimalString/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								};
								if (vErrors === null) vErrors = [err2];
								else vErrors.push(err2);
								errors++;
							}
						}
						var _valid0 = _errs4 === errors;
						valid1 = valid1 || _valid0;
						const _errs7 = errors;
						if (data0 !== null) {
							const err3 = {
								instancePath: instancePath + "/after_seq",
								schemaPath: "#/properties/after_seq/anyOf/1/type",
								keyword: "type",
								params: { type: "null" },
								message: "must be null"
							};
							if (vErrors === null) vErrors = [err3];
							else vErrors.push(err3);
							errors++;
						}
						var _valid0 = _errs7 === errors;
						valid1 = valid1 || _valid0;
						if (!valid1) {
							const err4 = {
								instancePath: instancePath + "/after_seq",
								schemaPath: "#/properties/after_seq/anyOf",
								keyword: "anyOf",
								params: {},
								message: "must match a schema in anyOf"
							};
							if (vErrors === null) vErrors = [err4];
							else vErrors.push(err4);
							errors++;
							validate60.errors = vErrors;
							return false;
						} else {
							errors = _errs3;
							if (vErrors !== null) {
								if (_errs3) vErrors.length = _errs3;
								else vErrors = null;
							}
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.around_seq !== void 0) {
							let data1 = data.around_seq;
							const _errs9 = errors;
							const _errs10 = errors;
							let valid3 = false;
							const _errs11 = errors;
							if (errors === errors) {
								if (typeof data1 === "string") {
									if (func1(data1) > 19) {
										const err5 = {
											instancePath: instancePath + "/around_seq",
											schemaPath: "#/$defs/DecimalString/maxLength",
											keyword: "maxLength",
											params: { limit: 19 },
											message: "must NOT have more than 19 characters"
										};
										if (vErrors === null) vErrors = [err5];
										else vErrors.push(err5);
										errors++;
									} else if (!pattern4.test(data1)) {
										const err6 = {
											instancePath: instancePath + "/around_seq",
											schemaPath: "#/$defs/DecimalString/pattern",
											keyword: "pattern",
											params: { pattern: "^(0|[1-9][0-9]*)$" },
											message: "must match pattern \"^(0|[1-9][0-9]*)$\""
										};
										if (vErrors === null) vErrors = [err6];
										else vErrors.push(err6);
										errors++;
									}
								} else {
									const err7 = {
										instancePath: instancePath + "/around_seq",
										schemaPath: "#/$defs/DecimalString/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									};
									if (vErrors === null) vErrors = [err7];
									else vErrors.push(err7);
									errors++;
								}
							}
							var _valid1 = _errs11 === errors;
							valid3 = valid3 || _valid1;
							const _errs14 = errors;
							if (data1 !== null) {
								const err8 = {
									instancePath: instancePath + "/around_seq",
									schemaPath: "#/properties/around_seq/anyOf/1/type",
									keyword: "type",
									params: { type: "null" },
									message: "must be null"
								};
								if (vErrors === null) vErrors = [err8];
								else vErrors.push(err8);
								errors++;
							}
							var _valid1 = _errs14 === errors;
							valid3 = valid3 || _valid1;
							if (!valid3) {
								const err9 = {
									instancePath: instancePath + "/around_seq",
									schemaPath: "#/properties/around_seq/anyOf",
									keyword: "anyOf",
									params: {},
									message: "must match a schema in anyOf"
								};
								if (vErrors === null) vErrors = [err9];
								else vErrors.push(err9);
								errors++;
								validate60.errors = vErrors;
								return false;
							} else {
								errors = _errs10;
								if (vErrors !== null) {
									if (_errs10) vErrors.length = _errs10;
									else vErrors = null;
								}
							}
							var valid0 = _errs9 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.before_seq !== void 0) {
								let data2 = data.before_seq;
								const _errs16 = errors;
								const _errs17 = errors;
								let valid5 = false;
								const _errs18 = errors;
								if (errors === errors) {
									if (typeof data2 === "string") {
										if (func1(data2) > 19) {
											const err10 = {
												instancePath: instancePath + "/before_seq",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											};
											if (vErrors === null) vErrors = [err10];
											else vErrors.push(err10);
											errors++;
										} else if (!pattern4.test(data2)) {
											const err11 = {
												instancePath: instancePath + "/before_seq",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											};
											if (vErrors === null) vErrors = [err11];
											else vErrors.push(err11);
											errors++;
										}
									} else {
										const err12 = {
											instancePath: instancePath + "/before_seq",
											schemaPath: "#/$defs/DecimalString/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										};
										if (vErrors === null) vErrors = [err12];
										else vErrors.push(err12);
										errors++;
									}
								}
								var _valid2 = _errs18 === errors;
								valid5 = valid5 || _valid2;
								const _errs21 = errors;
								if (data2 !== null) {
									const err13 = {
										instancePath: instancePath + "/before_seq",
										schemaPath: "#/properties/before_seq/anyOf/1/type",
										keyword: "type",
										params: { type: "null" },
										message: "must be null"
									};
									if (vErrors === null) vErrors = [err13];
									else vErrors.push(err13);
									errors++;
								}
								var _valid2 = _errs21 === errors;
								valid5 = valid5 || _valid2;
								if (!valid5) {
									const err14 = {
										instancePath: instancePath + "/before_seq",
										schemaPath: "#/properties/before_seq/anyOf",
										keyword: "anyOf",
										params: {},
										message: "must match a schema in anyOf"
									};
									if (vErrors === null) vErrors = [err14];
									else vErrors.push(err14);
									errors++;
									validate60.errors = vErrors;
									return false;
								} else {
									errors = _errs17;
									if (vErrors !== null) {
										if (_errs17) vErrors.length = _errs17;
										else vErrors = null;
									}
								}
								var valid0 = _errs16 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.data_generation_id !== void 0) {
									const _errs23 = errors;
									if (typeof data.data_generation_id !== "string") {
										validate60.errors = [{
											instancePath: instancePath + "/data_generation_id",
											schemaPath: "#/properties/data_generation_id/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = _errs23 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.limit !== void 0) {
										let data4 = data.limit;
										const _errs25 = errors;
										if (!(typeof data4 == "number" && !(data4 % 1) && !isNaN(data4) && isFinite(data4))) {
											validate60.errors = [{
												instancePath: instancePath + "/limit",
												schemaPath: "#/properties/limit/type",
												keyword: "type",
												params: { type: "integer" },
												message: "must be integer"
											}];
											return false;
										}
										if (errors === _errs25) {
											if (typeof data4 == "number" && isFinite(data4)) {
												if (data4 > 200 || isNaN(data4)) {
													validate60.errors = [{
														instancePath: instancePath + "/limit",
														schemaPath: "#/properties/limit/maximum",
														keyword: "maximum",
														params: {
															comparison: "<=",
															limit: 200
														},
														message: "must be <= 200"
													}];
													return false;
												} else if (data4 < 1 || isNaN(data4)) {
													validate60.errors = [{
														instancePath: instancePath + "/limit",
														schemaPath: "#/properties/limit/minimum",
														keyword: "minimum",
														params: {
															comparison: ">=",
															limit: 1
														},
														message: "must be >= 1"
													}];
													return false;
												}
											}
										}
										var valid0 = _errs25 === errors;
									} else var valid0 = true;
								}
							}
						}
					}
				}
			}
		} else {
			validate60.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate60.errors = vErrors;
	return errors === 0;
}
validate60.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateChatListResponse = validate61;
var schema99 = {
	"enum": ["0.3"],
	"type": "string"
};
var schema90 = {
	"additionalProperties": false,
	"properties": {
		"created_at": {
			"format": "int64",
			"maximum": 9007199254740991,
			"minimum": -9007199254740991,
			"type": "integer"
		},
		"id": { "type": "string" },
		"mention_all": { "type": "boolean" },
		"mention_ids": {
			"items": { "type": "string" },
			"type": "array"
		},
		"parts": {
			"items": { "$ref": "#/$defs/MessagePart" },
			"type": "array"
		},
		"quote_message_id": { "type": ["string", "null"] },
		"sender_id": { "type": "string" },
		"sender_snapshot": { "$ref": "#/$defs/SenderSnapshot" },
		"seq": { "$ref": "#/$defs/DecimalString" },
		"state": { "$ref": "#/$defs/MessageState" }
	},
	"required": [
		"id",
		"seq",
		"sender_id",
		"sender_snapshot",
		"created_at",
		"state",
		"parts",
		"quote_message_id",
		"mention_ids",
		"mention_all"
	],
	"type": "object"
};
var schema95 = {
	"enum": [
		"visible",
		"recalled",
		"deleted"
	],
	"type": "string"
};
var schema93 = {
	"enum": ["user", "agent"],
	"type": "string"
};
function validate65(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate65.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.display_name === void 0 && (missing0 = "display_name") || data.kind === void 0 && (missing0 = "kind")) {
			validate65.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "display_name" || key0 === "kind")) {
				validate65.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.display_name !== void 0) {
				if (typeof data.display_name !== "string") {
					validate65.errors = [{
						instancePath: instancePath + "/display_name",
						schemaPath: "#/properties/display_name/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.kind !== void 0) {
					let data1 = data.kind;
					if (typeof data1 !== "string") {
						validate65.errors = [{
							instancePath: instancePath + "/kind",
							schemaPath: "#/$defs/ParticipantKind/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					if (!(data1 === "user" || data1 === "agent")) {
						validate65.errors = [{
							instancePath: instancePath + "/kind",
							schemaPath: "#/$defs/ParticipantKind/enum",
							keyword: "enum",
							params: { allowedValues: schema93.enum },
							message: "must be equal to one of the allowed values"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
			}
		}
	} else {
		validate65.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate65.errors = vErrors;
	return true;
}
validate65.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate64(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate64.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.id === void 0 && (missing0 = "id") || data.seq === void 0 && (missing0 = "seq") || data.sender_id === void 0 && (missing0 = "sender_id") || data.sender_snapshot === void 0 && (missing0 = "sender_snapshot") || data.created_at === void 0 && (missing0 = "created_at") || data.state === void 0 && (missing0 = "state") || data.parts === void 0 && (missing0 = "parts") || data.quote_message_id === void 0 && (missing0 = "quote_message_id") || data.mention_ids === void 0 && (missing0 = "mention_ids") || data.mention_all === void 0 && (missing0 = "mention_all")) {
				validate64.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!func2.call(schema90.properties, key0)) {
					validate64.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.created_at !== void 0) {
						let data0 = data.created_at;
						const _errs2 = errors;
						if (!(typeof data0 == "number" && !(data0 % 1) && !isNaN(data0) && isFinite(data0))) {
							validate64.errors = [{
								instancePath: instancePath + "/created_at",
								schemaPath: "#/properties/created_at/type",
								keyword: "type",
								params: { type: "integer" },
								message: "must be integer"
							}];
							return false;
						}
						if (errors === _errs2) {
							if (typeof data0 == "number" && isFinite(data0)) {
								if (data0 > 9007199254740991 || isNaN(data0)) {
									validate64.errors = [{
										instancePath: instancePath + "/created_at",
										schemaPath: "#/properties/created_at/maximum",
										keyword: "maximum",
										params: {
											comparison: "<=",
											limit: 9007199254740991
										},
										message: "must be <= 9007199254740991"
									}];
									return false;
								} else if (data0 < -9007199254740991 || isNaN(data0)) {
									validate64.errors = [{
										instancePath: instancePath + "/created_at",
										schemaPath: "#/properties/created_at/minimum",
										keyword: "minimum",
										params: {
											comparison: ">=",
											limit: -9007199254740991
										},
										message: "must be >= -9007199254740991"
									}];
									return false;
								}
							}
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.id !== void 0) {
							const _errs4 = errors;
							if (typeof data.id !== "string") {
								validate64.errors = [{
									instancePath: instancePath + "/id",
									schemaPath: "#/properties/id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.mention_all !== void 0) {
								const _errs6 = errors;
								if (typeof data.mention_all !== "boolean") {
									validate64.errors = [{
										instancePath: instancePath + "/mention_all",
										schemaPath: "#/properties/mention_all/type",
										keyword: "type",
										params: { type: "boolean" },
										message: "must be boolean"
									}];
									return false;
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.mention_ids !== void 0) {
									let data3 = data.mention_ids;
									const _errs8 = errors;
									if (errors === _errs8) {
										if (Array.isArray(data3)) {
											const len0 = data3.length;
											for (let i0 = 0; i0 < len0; i0++) {
												const _errs10 = errors;
												if (typeof data3[i0] !== "string") {
													validate64.errors = [{
														instancePath: instancePath + "/mention_ids/" + i0,
														schemaPath: "#/properties/mention_ids/items/type",
														keyword: "type",
														params: { type: "string" },
														message: "must be string"
													}];
													return false;
												}
												if (!(_errs10 === errors)) break;
											}
										} else {
											validate64.errors = [{
												instancePath: instancePath + "/mention_ids",
												schemaPath: "#/properties/mention_ids/type",
												keyword: "type",
												params: { type: "array" },
												message: "must be array"
											}];
											return false;
										}
									}
									var valid0 = _errs8 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.parts !== void 0) {
										let data5 = data.parts;
										const _errs12 = errors;
										if (errors === _errs12) {
											if (Array.isArray(data5)) {
												const len1 = data5.length;
												for (let i1 = 0; i1 < len1; i1++) {
													let data6 = data5[i1];
													const _errs14 = errors;
													const _errs16 = errors;
													let valid4 = false;
													let passing0 = null;
													const _errs17 = errors;
													if (errors === _errs17) {
														if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
															let missing1;
															if (data6.kind === void 0 && (missing1 = "kind") || data6.text === void 0 && (missing1 = "text")) {
																const err0 = {
																	instancePath: instancePath + "/parts/" + i1,
																	schemaPath: "#/$defs/MessagePart/oneOf/0/required",
																	keyword: "required",
																	params: { missingProperty: missing1 },
																	message: "must have required property '" + missing1 + "'"
																};
																if (vErrors === null) vErrors = [err0];
																else vErrors.push(err0);
																errors++;
															} else {
																const _errs19 = errors;
																for (const key1 in data6) if (!(key1 === "kind" || key1 === "text")) {
																	const err1 = {
																		instancePath: instancePath + "/parts/" + i1,
																		schemaPath: "#/$defs/MessagePart/oneOf/0/additionalProperties",
																		keyword: "additionalProperties",
																		params: { additionalProperty: key1 },
																		message: "must NOT have additional properties"
																	};
																	if (vErrors === null) vErrors = [err1];
																	else vErrors.push(err1);
																	errors++;
																	break;
																}
																if (_errs19 === errors) {
																	if (data6.kind !== void 0) {
																		let data7 = data6.kind;
																		const _errs20 = errors;
																		if (typeof data7 !== "string") {
																			const err2 = {
																				instancePath: instancePath + "/parts/" + i1 + "/kind",
																				schemaPath: "#/$defs/MessagePart/oneOf/0/properties/kind/type",
																				keyword: "type",
																				params: { type: "string" },
																				message: "must be string"
																			};
																			if (vErrors === null) vErrors = [err2];
																			else vErrors.push(err2);
																			errors++;
																		}
																		if ("text" !== data7) {
																			const err3 = {
																				instancePath: instancePath + "/parts/" + i1 + "/kind",
																				schemaPath: "#/$defs/MessagePart/oneOf/0/properties/kind/const",
																				keyword: "const",
																				params: { allowedValue: "text" },
																				message: "must be equal to constant"
																			};
																			if (vErrors === null) vErrors = [err3];
																			else vErrors.push(err3);
																			errors++;
																		}
																		var valid5 = _errs20 === errors;
																	} else var valid5 = true;
																	if (valid5) {
																		if (data6.text !== void 0) {
																			const _errs22 = errors;
																			if (typeof data6.text !== "string") {
																				const err4 = {
																					instancePath: instancePath + "/parts/" + i1 + "/text",
																					schemaPath: "#/$defs/MessagePart/oneOf/0/properties/text/type",
																					keyword: "type",
																					params: { type: "string" },
																					message: "must be string"
																				};
																				if (vErrors === null) vErrors = [err4];
																				else vErrors.push(err4);
																				errors++;
																			}
																			var valid5 = _errs22 === errors;
																		} else var valid5 = true;
																	}
																}
															}
														} else {
															const err5 = {
																instancePath: instancePath + "/parts/" + i1,
																schemaPath: "#/$defs/MessagePart/oneOf/0/type",
																keyword: "type",
																params: { type: "object" },
																message: "must be object"
															};
															if (vErrors === null) vErrors = [err5];
															else vErrors.push(err5);
															errors++;
														}
													}
													var _valid0 = _errs17 === errors;
													if (_valid0) {
														valid4 = true;
														passing0 = 0;
														var props0 = true;
													}
													const _errs24 = errors;
													if (errors === _errs24) {
														if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
															let missing2;
															if (data6.kind === void 0 && (missing2 = "kind") || data6.attachment_id === void 0 && (missing2 = "attachment_id")) {
																const err6 = {
																	instancePath: instancePath + "/parts/" + i1,
																	schemaPath: "#/$defs/MessagePart/oneOf/1/required",
																	keyword: "required",
																	params: { missingProperty: missing2 },
																	message: "must have required property '" + missing2 + "'"
																};
																if (vErrors === null) vErrors = [err6];
																else vErrors.push(err6);
																errors++;
															} else {
																const _errs26 = errors;
																for (const key2 in data6) if (!(key2 === "attachment_id" || key2 === "kind")) {
																	const err7 = {
																		instancePath: instancePath + "/parts/" + i1,
																		schemaPath: "#/$defs/MessagePart/oneOf/1/additionalProperties",
																		keyword: "additionalProperties",
																		params: { additionalProperty: key2 },
																		message: "must NOT have additional properties"
																	};
																	if (vErrors === null) vErrors = [err7];
																	else vErrors.push(err7);
																	errors++;
																	break;
																}
																if (_errs26 === errors) {
																	if (data6.attachment_id !== void 0) {
																		const _errs27 = errors;
																		if (typeof data6.attachment_id !== "string") {
																			const err8 = {
																				instancePath: instancePath + "/parts/" + i1 + "/attachment_id",
																				schemaPath: "#/$defs/MessagePart/oneOf/1/properties/attachment_id/type",
																				keyword: "type",
																				params: { type: "string" },
																				message: "must be string"
																			};
																			if (vErrors === null) vErrors = [err8];
																			else vErrors.push(err8);
																			errors++;
																		}
																		var valid6 = _errs27 === errors;
																	} else var valid6 = true;
																	if (valid6) {
																		if (data6.kind !== void 0) {
																			let data10 = data6.kind;
																			const _errs29 = errors;
																			if (typeof data10 !== "string") {
																				const err9 = {
																					instancePath: instancePath + "/parts/" + i1 + "/kind",
																					schemaPath: "#/$defs/MessagePart/oneOf/1/properties/kind/type",
																					keyword: "type",
																					params: { type: "string" },
																					message: "must be string"
																				};
																				if (vErrors === null) vErrors = [err9];
																				else vErrors.push(err9);
																				errors++;
																			}
																			if ("attachment" !== data10) {
																				const err10 = {
																					instancePath: instancePath + "/parts/" + i1 + "/kind",
																					schemaPath: "#/$defs/MessagePart/oneOf/1/properties/kind/const",
																					keyword: "const",
																					params: { allowedValue: "attachment" },
																					message: "must be equal to constant"
																				};
																				if (vErrors === null) vErrors = [err10];
																				else vErrors.push(err10);
																				errors++;
																			}
																			var valid6 = _errs29 === errors;
																		} else var valid6 = true;
																	}
																}
															}
														} else {
															const err11 = {
																instancePath: instancePath + "/parts/" + i1,
																schemaPath: "#/$defs/MessagePart/oneOf/1/type",
																keyword: "type",
																params: { type: "object" },
																message: "must be object"
															};
															if (vErrors === null) vErrors = [err11];
															else vErrors.push(err11);
															errors++;
														}
													}
													var _valid0 = _errs24 === errors;
													if (_valid0 && valid4) {
														valid4 = false;
														passing0 = [passing0, 1];
													} else {
														if (_valid0) {
															valid4 = true;
															passing0 = 1;
															if (props0 !== true) props0 = true;
														}
														const _errs31 = errors;
														if (errors === _errs31) {
															if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
																let missing3;
																if (data6.kind === void 0 && (missing3 = "kind") || data6.emote_id === void 0 && (missing3 = "emote_id")) {
																	const err12 = {
																		instancePath: instancePath + "/parts/" + i1,
																		schemaPath: "#/$defs/MessagePart/oneOf/2/required",
																		keyword: "required",
																		params: { missingProperty: missing3 },
																		message: "must have required property '" + missing3 + "'"
																	};
																	if (vErrors === null) vErrors = [err12];
																	else vErrors.push(err12);
																	errors++;
																} else {
																	const _errs33 = errors;
																	for (const key3 in data6) if (!(key3 === "emote_id" || key3 === "kind")) {
																		const err13 = {
																			instancePath: instancePath + "/parts/" + i1,
																			schemaPath: "#/$defs/MessagePart/oneOf/2/additionalProperties",
																			keyword: "additionalProperties",
																			params: { additionalProperty: key3 },
																			message: "must NOT have additional properties"
																		};
																		if (vErrors === null) vErrors = [err13];
																		else vErrors.push(err13);
																		errors++;
																		break;
																	}
																	if (_errs33 === errors) {
																		if (data6.emote_id !== void 0) {
																			const _errs34 = errors;
																			if (typeof data6.emote_id !== "string") {
																				const err14 = {
																					instancePath: instancePath + "/parts/" + i1 + "/emote_id",
																					schemaPath: "#/$defs/MessagePart/oneOf/2/properties/emote_id/type",
																					keyword: "type",
																					params: { type: "string" },
																					message: "must be string"
																				};
																				if (vErrors === null) vErrors = [err14];
																				else vErrors.push(err14);
																				errors++;
																			}
																			var valid7 = _errs34 === errors;
																		} else var valid7 = true;
																		if (valid7) {
																			if (data6.kind !== void 0) {
																				let data12 = data6.kind;
																				const _errs36 = errors;
																				if (typeof data12 !== "string") {
																					const err15 = {
																						instancePath: instancePath + "/parts/" + i1 + "/kind",
																						schemaPath: "#/$defs/MessagePart/oneOf/2/properties/kind/type",
																						keyword: "type",
																						params: { type: "string" },
																						message: "must be string"
																					};
																					if (vErrors === null) vErrors = [err15];
																					else vErrors.push(err15);
																					errors++;
																				}
																				if ("emote" !== data12) {
																					const err16 = {
																						instancePath: instancePath + "/parts/" + i1 + "/kind",
																						schemaPath: "#/$defs/MessagePart/oneOf/2/properties/kind/const",
																						keyword: "const",
																						params: { allowedValue: "emote" },
																						message: "must be equal to constant"
																					};
																					if (vErrors === null) vErrors = [err16];
																					else vErrors.push(err16);
																					errors++;
																				}
																				var valid7 = _errs36 === errors;
																			} else var valid7 = true;
																		}
																	}
																}
															} else {
																const err17 = {
																	instancePath: instancePath + "/parts/" + i1,
																	schemaPath: "#/$defs/MessagePart/oneOf/2/type",
																	keyword: "type",
																	params: { type: "object" },
																	message: "must be object"
																};
																if (vErrors === null) vErrors = [err17];
																else vErrors.push(err17);
																errors++;
															}
														}
														var _valid0 = _errs31 === errors;
														if (_valid0 && valid4) {
															valid4 = false;
															passing0 = [passing0, 2];
														} else if (_valid0) {
															valid4 = true;
															passing0 = 2;
															if (props0 !== true) props0 = true;
														}
													}
													if (!valid4) {
														const err18 = {
															instancePath: instancePath + "/parts/" + i1,
															schemaPath: "#/$defs/MessagePart/oneOf",
															keyword: "oneOf",
															params: { passingSchemas: passing0 },
															message: "must match exactly one schema in oneOf"
														};
														if (vErrors === null) vErrors = [err18];
														else vErrors.push(err18);
														errors++;
														validate64.errors = vErrors;
														return false;
													} else {
														errors = _errs16;
														if (vErrors !== null) {
															if (_errs16) vErrors.length = _errs16;
															else vErrors = null;
														}
													}
													if (!(_errs14 === errors)) break;
												}
											} else {
												validate64.errors = [{
													instancePath: instancePath + "/parts",
													schemaPath: "#/properties/parts/type",
													keyword: "type",
													params: { type: "array" },
													message: "must be array"
												}];
												return false;
											}
										}
										var valid0 = _errs12 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.quote_message_id !== void 0) {
											let data13 = data.quote_message_id;
											const _errs38 = errors;
											if (typeof data13 !== "string" && data13 !== null) {
												validate64.errors = [{
													instancePath: instancePath + "/quote_message_id",
													schemaPath: "#/properties/quote_message_id/type",
													keyword: "type",
													params: { type: schema90.properties.quote_message_id.type },
													message: "must be string,null"
												}];
												return false;
											}
											var valid0 = _errs38 === errors;
										} else var valid0 = true;
										if (valid0) {
											if (data.sender_id !== void 0) {
												const _errs40 = errors;
												if (typeof data.sender_id !== "string") {
													validate64.errors = [{
														instancePath: instancePath + "/sender_id",
														schemaPath: "#/properties/sender_id/type",
														keyword: "type",
														params: { type: "string" },
														message: "must be string"
													}];
													return false;
												}
												var valid0 = _errs40 === errors;
											} else var valid0 = true;
											if (valid0) {
												if (data.sender_snapshot !== void 0) {
													const _errs42 = errors;
													if (!validate65(data.sender_snapshot, {
														instancePath: instancePath + "/sender_snapshot",
														parentData: data,
														parentDataProperty: "sender_snapshot",
														rootData,
														dynamicAnchors
													})) {
														vErrors = vErrors === null ? validate65.errors : vErrors.concat(validate65.errors);
														errors = vErrors.length;
													}
													var valid0 = _errs42 === errors;
												} else var valid0 = true;
												if (valid0) {
													if (data.seq !== void 0) {
														let data16 = data.seq;
														const _errs43 = errors;
														if (errors === errors) {
															if (typeof data16 === "string") {
																if (func1(data16) > 19) {
																	validate64.errors = [{
																		instancePath: instancePath + "/seq",
																		schemaPath: "#/$defs/DecimalString/maxLength",
																		keyword: "maxLength",
																		params: { limit: 19 },
																		message: "must NOT have more than 19 characters"
																	}];
																	return false;
																} else if (!pattern4.test(data16)) {
																	validate64.errors = [{
																		instancePath: instancePath + "/seq",
																		schemaPath: "#/$defs/DecimalString/pattern",
																		keyword: "pattern",
																		params: { pattern: "^(0|[1-9][0-9]*)$" },
																		message: "must match pattern \"^(0|[1-9][0-9]*)$\""
																	}];
																	return false;
																}
															} else {
																validate64.errors = [{
																	instancePath: instancePath + "/seq",
																	schemaPath: "#/$defs/DecimalString/type",
																	keyword: "type",
																	params: { type: "string" },
																	message: "must be string"
																}];
																return false;
															}
														}
														var valid0 = _errs43 === errors;
													} else var valid0 = true;
													if (valid0) {
														if (data.state !== void 0) {
															let data17 = data.state;
															const _errs46 = errors;
															if (typeof data17 !== "string") {
																validate64.errors = [{
																	instancePath: instancePath + "/state",
																	schemaPath: "#/$defs/MessageState/type",
																	keyword: "type",
																	params: { type: "string" },
																	message: "must be string"
																}];
																return false;
															}
															if (!(data17 === "visible" || data17 === "recalled" || data17 === "deleted")) {
																validate64.errors = [{
																	instancePath: instancePath + "/state",
																	schemaPath: "#/$defs/MessageState/enum",
																	keyword: "enum",
																	params: { allowedValues: schema95.enum },
																	message: "must be equal to one of the allowed values"
																}];
																return false;
															}
															var valid0 = _errs46 === errors;
														} else var valid0 = true;
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate64.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate64.errors = vErrors;
	return errors === 0;
}
validate64.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate63(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate63.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.items === void 0 && (missing0 = "items") || data.first_seq === void 0 && (missing0 = "first_seq") || data.last_seq === void 0 && (missing0 = "last_seq") || data.has_more_before === void 0 && (missing0 = "has_more_before") || data.has_more_after === void 0 && (missing0 = "has_more_after") || data.latest_message_seq === void 0 && (missing0 = "latest_message_seq") || data.latest_event_seq === void 0 && (missing0 = "latest_event_seq")) {
				validate63.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "first_seq" || key0 === "has_more_after" || key0 === "has_more_before" || key0 === "items" || key0 === "last_seq" || key0 === "latest_event_seq" || key0 === "latest_message_seq")) {
					validate63.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.data_generation_id !== void 0) {
						const _errs2 = errors;
						if (typeof data.data_generation_id !== "string") {
							validate63.errors = [{
								instancePath: instancePath + "/data_generation_id",
								schemaPath: "#/properties/data_generation_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.first_seq !== void 0) {
							let data1 = data.first_seq;
							const _errs4 = errors;
							const _errs5 = errors;
							let valid1 = false;
							const _errs6 = errors;
							if (errors === errors) {
								if (typeof data1 === "string") {
									if (func1(data1) > 19) {
										const err0 = {
											instancePath: instancePath + "/first_seq",
											schemaPath: "#/$defs/DecimalString/maxLength",
											keyword: "maxLength",
											params: { limit: 19 },
											message: "must NOT have more than 19 characters"
										};
										if (vErrors === null) vErrors = [err0];
										else vErrors.push(err0);
										errors++;
									} else if (!pattern4.test(data1)) {
										const err1 = {
											instancePath: instancePath + "/first_seq",
											schemaPath: "#/$defs/DecimalString/pattern",
											keyword: "pattern",
											params: { pattern: "^(0|[1-9][0-9]*)$" },
											message: "must match pattern \"^(0|[1-9][0-9]*)$\""
										};
										if (vErrors === null) vErrors = [err1];
										else vErrors.push(err1);
										errors++;
									}
								} else {
									const err2 = {
										instancePath: instancePath + "/first_seq",
										schemaPath: "#/$defs/DecimalString/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									};
									if (vErrors === null) vErrors = [err2];
									else vErrors.push(err2);
									errors++;
								}
							}
							var _valid0 = _errs6 === errors;
							valid1 = valid1 || _valid0;
							const _errs9 = errors;
							if (data1 !== null) {
								const err3 = {
									instancePath: instancePath + "/first_seq",
									schemaPath: "#/properties/first_seq/anyOf/1/type",
									keyword: "type",
									params: { type: "null" },
									message: "must be null"
								};
								if (vErrors === null) vErrors = [err3];
								else vErrors.push(err3);
								errors++;
							}
							var _valid0 = _errs9 === errors;
							valid1 = valid1 || _valid0;
							if (!valid1) {
								const err4 = {
									instancePath: instancePath + "/first_seq",
									schemaPath: "#/properties/first_seq/anyOf",
									keyword: "anyOf",
									params: {},
									message: "must match a schema in anyOf"
								};
								if (vErrors === null) vErrors = [err4];
								else vErrors.push(err4);
								errors++;
								validate63.errors = vErrors;
								return false;
							} else {
								errors = _errs5;
								if (vErrors !== null) {
									if (_errs5) vErrors.length = _errs5;
									else vErrors = null;
								}
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.has_more_after !== void 0) {
								const _errs11 = errors;
								if (typeof data.has_more_after !== "boolean") {
									validate63.errors = [{
										instancePath: instancePath + "/has_more_after",
										schemaPath: "#/properties/has_more_after/type",
										keyword: "type",
										params: { type: "boolean" },
										message: "must be boolean"
									}];
									return false;
								}
								var valid0 = _errs11 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.has_more_before !== void 0) {
									const _errs13 = errors;
									if (typeof data.has_more_before !== "boolean") {
										validate63.errors = [{
											instancePath: instancePath + "/has_more_before",
											schemaPath: "#/properties/has_more_before/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = _errs13 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.items !== void 0) {
										let data4 = data.items;
										const _errs15 = errors;
										if (errors === _errs15) {
											if (Array.isArray(data4)) {
												const len0 = data4.length;
												for (let i0 = 0; i0 < len0; i0++) {
													const _errs17 = errors;
													if (!validate64(data4[i0], {
														instancePath: instancePath + "/items/" + i0,
														parentData: data4,
														parentDataProperty: i0,
														rootData,
														dynamicAnchors
													})) {
														vErrors = vErrors === null ? validate64.errors : vErrors.concat(validate64.errors);
														errors = vErrors.length;
													}
													if (!(_errs17 === errors)) break;
												}
											} else {
												validate63.errors = [{
													instancePath: instancePath + "/items",
													schemaPath: "#/properties/items/type",
													keyword: "type",
													params: { type: "array" },
													message: "must be array"
												}];
												return false;
											}
										}
										var valid0 = _errs15 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.last_seq !== void 0) {
											let data6 = data.last_seq;
											const _errs18 = errors;
											const _errs19 = errors;
											let valid4 = false;
											const _errs20 = errors;
											if (errors === errors) {
												if (typeof data6 === "string") {
													if (func1(data6) > 19) {
														const err5 = {
															instancePath: instancePath + "/last_seq",
															schemaPath: "#/$defs/DecimalString/maxLength",
															keyword: "maxLength",
															params: { limit: 19 },
															message: "must NOT have more than 19 characters"
														};
														if (vErrors === null) vErrors = [err5];
														else vErrors.push(err5);
														errors++;
													} else if (!pattern4.test(data6)) {
														const err6 = {
															instancePath: instancePath + "/last_seq",
															schemaPath: "#/$defs/DecimalString/pattern",
															keyword: "pattern",
															params: { pattern: "^(0|[1-9][0-9]*)$" },
															message: "must match pattern \"^(0|[1-9][0-9]*)$\""
														};
														if (vErrors === null) vErrors = [err6];
														else vErrors.push(err6);
														errors++;
													}
												} else {
													const err7 = {
														instancePath: instancePath + "/last_seq",
														schemaPath: "#/$defs/DecimalString/type",
														keyword: "type",
														params: { type: "string" },
														message: "must be string"
													};
													if (vErrors === null) vErrors = [err7];
													else vErrors.push(err7);
													errors++;
												}
											}
											var _valid1 = _errs20 === errors;
											valid4 = valid4 || _valid1;
											const _errs23 = errors;
											if (data6 !== null) {
												const err8 = {
													instancePath: instancePath + "/last_seq",
													schemaPath: "#/properties/last_seq/anyOf/1/type",
													keyword: "type",
													params: { type: "null" },
													message: "must be null"
												};
												if (vErrors === null) vErrors = [err8];
												else vErrors.push(err8);
												errors++;
											}
											var _valid1 = _errs23 === errors;
											valid4 = valid4 || _valid1;
											if (!valid4) {
												const err9 = {
													instancePath: instancePath + "/last_seq",
													schemaPath: "#/properties/last_seq/anyOf",
													keyword: "anyOf",
													params: {},
													message: "must match a schema in anyOf"
												};
												if (vErrors === null) vErrors = [err9];
												else vErrors.push(err9);
												errors++;
												validate63.errors = vErrors;
												return false;
											} else {
												errors = _errs19;
												if (vErrors !== null) {
													if (_errs19) vErrors.length = _errs19;
													else vErrors = null;
												}
											}
											var valid0 = _errs18 === errors;
										} else var valid0 = true;
										if (valid0) {
											if (data.latest_event_seq !== void 0) {
												let data7 = data.latest_event_seq;
												const _errs25 = errors;
												if (errors === errors) {
													if (typeof data7 === "string") {
														if (func1(data7) > 19) {
															validate63.errors = [{
																instancePath: instancePath + "/latest_event_seq",
																schemaPath: "#/$defs/DecimalString/maxLength",
																keyword: "maxLength",
																params: { limit: 19 },
																message: "must NOT have more than 19 characters"
															}];
															return false;
														} else if (!pattern4.test(data7)) {
															validate63.errors = [{
																instancePath: instancePath + "/latest_event_seq",
																schemaPath: "#/$defs/DecimalString/pattern",
																keyword: "pattern",
																params: { pattern: "^(0|[1-9][0-9]*)$" },
																message: "must match pattern \"^(0|[1-9][0-9]*)$\""
															}];
															return false;
														}
													} else {
														validate63.errors = [{
															instancePath: instancePath + "/latest_event_seq",
															schemaPath: "#/$defs/DecimalString/type",
															keyword: "type",
															params: { type: "string" },
															message: "must be string"
														}];
														return false;
													}
												}
												var valid0 = _errs25 === errors;
											} else var valid0 = true;
											if (valid0) {
												if (data.latest_message_seq !== void 0) {
													let data8 = data.latest_message_seq;
													const _errs28 = errors;
													if (errors === errors) {
														if (typeof data8 === "string") {
															if (func1(data8) > 19) {
																validate63.errors = [{
																	instancePath: instancePath + "/latest_message_seq",
																	schemaPath: "#/$defs/DecimalString/maxLength",
																	keyword: "maxLength",
																	params: { limit: 19 },
																	message: "must NOT have more than 19 characters"
																}];
																return false;
															} else if (!pattern4.test(data8)) {
																validate63.errors = [{
																	instancePath: instancePath + "/latest_message_seq",
																	schemaPath: "#/$defs/DecimalString/pattern",
																	keyword: "pattern",
																	params: { pattern: "^(0|[1-9][0-9]*)$" },
																	message: "must match pattern \"^(0|[1-9][0-9]*)$\""
																}];
																return false;
															}
														} else {
															validate63.errors = [{
																instancePath: instancePath + "/latest_message_seq",
																schemaPath: "#/$defs/DecimalString/type",
																keyword: "type",
																params: { type: "string" },
																message: "must be string"
															}];
															return false;
														}
													}
													var valid0 = _errs28 === errors;
												} else var valid0 = true;
											}
										}
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate63.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate63.errors = vErrors;
	return errors === 0;
}
validate63.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate62(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate62.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate62.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "data" || key0 === "schema_version")) {
					validate62.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.data !== void 0) {
						const _errs2 = errors;
						if (!validate63(data.data, {
							instancePath: instancePath + "/data",
							parentData: data,
							parentDataProperty: "data",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate63.errors : vErrors.concat(validate63.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate62.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate62.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema99.enum },
									message: "must be equal to one of the allowed values"
								}];
								return false;
							}
							var valid0 = _errs3 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate62.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate62.errors = vErrors;
	return errors === 0;
}
validate62.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema101 = {
	"additionalProperties": false,
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"field_path": { "type": ["string", "null"] },
		"may_have_been_charged": { "type": "boolean" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"trace_id": { "type": "string" }
	},
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	],
	"type": "object"
};
var schema102 = {
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	],
	"type": "string"
};
var schema103 = {
	"enum": [
		"never",
		"retry",
		"after_user_action"
	],
	"type": "string"
};
function validate71(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate71.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate71.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "field_path" || key0 === "may_have_been_charged" || key0 === "message" || key0 === "retryability" || key0 === "trace_id")) {
				validate71.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate71.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate71.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema102.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.field_path !== void 0) {
					let data1 = data.field_path;
					if (typeof data1 !== "string" && data1 !== null) {
						validate71.errors = [{
							instancePath: instancePath + "/field_path",
							schemaPath: "#/properties/field_path/type",
							keyword: "type",
							params: { type: schema101.properties.field_path.type },
							message: "must be string,null"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.may_have_been_charged !== void 0) {
						if (typeof data.may_have_been_charged !== "boolean") {
							validate71.errors = [{
								instancePath: instancePath + "/may_have_been_charged",
								schemaPath: "#/properties/may_have_been_charged/type",
								keyword: "type",
								params: { type: "boolean" },
								message: "must be boolean"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.message !== void 0) {
							if (typeof data.message !== "string") {
								validate71.errors = [{
									instancePath: instancePath + "/message",
									schemaPath: "#/properties/message/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.retryability !== void 0) {
								let data4 = data.retryability;
								if (typeof data4 !== "string") {
									validate71.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "never" || data4 === "retry" || data4 === "after_user_action")) {
									validate71.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/enum",
										keyword: "enum",
										params: { allowedValues: schema103.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.trace_id !== void 0) {
									if (typeof data.trace_id !== "string") {
										validate71.errors = [{
											instancePath: instancePath + "/trace_id",
											schemaPath: "#/properties/trace_id/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate71.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate71.errors = vErrors;
	return true;
}
validate71.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate70(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate70.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate70.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "error" || key0 === "schema_version")) {
					validate70.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.error !== void 0) {
						const _errs2 = errors;
						if (!validate71(data.error, {
							instancePath: instancePath + "/error",
							parentData: data,
							parentDataProperty: "error",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate71.errors : vErrors.concat(validate71.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate70.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate70.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema99.enum },
									message: "must be equal to one of the allowed values"
								}];
								return false;
							}
							var valid0 = _errs3 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate70.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate70.errors = vErrors;
	return errors === 0;
}
validate70.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate61(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate61.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate62(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate62.errors : vErrors.concat(validate62.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate70(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate70.errors : vErrors.concat(validate70.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate61.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate61.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate61.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateChatSearchRequest = validate74;
var schema105 = {
	"$schema": "https://json-schema.org/draft/2020-12/schema",
	"additionalProperties": false,
	"properties": {
		"cursor": {
			"default": null,
			"type": ["string", "null"]
		},
		"data_generation_id": { "type": "string" },
		"limit": {
			"format": "uint32",
			"maximum": 200,
			"minimum": 1,
			"type": "integer"
		},
		"query": {
			"maxLength": 256,
			"minLength": 1,
			"type": "string"
		},
		"search_id": { "type": "string" }
	},
	"required": [
		"data_generation_id",
		"search_id",
		"query",
		"limit"
	],
	"title": "ChatSearchRequest",
	"type": "object"
};
function validate74(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate74.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.search_id === void 0 && (missing0 = "search_id") || data.query === void 0 && (missing0 = "query") || data.limit === void 0 && (missing0 = "limit")) {
			validate74.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "cursor" || key0 === "data_generation_id" || key0 === "limit" || key0 === "query" || key0 === "search_id")) {
				validate74.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.cursor !== void 0) {
				let data0 = data.cursor;
				if (typeof data0 !== "string" && data0 !== null) {
					validate74.errors = [{
						instancePath: instancePath + "/cursor",
						schemaPath: "#/properties/cursor/type",
						keyword: "type",
						params: { type: schema105.properties.cursor.type },
						message: "must be string,null"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.data_generation_id !== void 0) {
					if (typeof data.data_generation_id !== "string") {
						validate74.errors = [{
							instancePath: instancePath + "/data_generation_id",
							schemaPath: "#/properties/data_generation_id/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.limit !== void 0) {
						let data2 = data.limit;
						if (!(typeof data2 == "number" && !(data2 % 1) && !isNaN(data2) && isFinite(data2))) {
							validate74.errors = [{
								instancePath: instancePath + "/limit",
								schemaPath: "#/properties/limit/type",
								keyword: "type",
								params: { type: "integer" },
								message: "must be integer"
							}];
							return false;
						}
						if (typeof data2 == "number" && isFinite(data2)) {
							if (data2 > 200 || isNaN(data2)) {
								validate74.errors = [{
									instancePath: instancePath + "/limit",
									schemaPath: "#/properties/limit/maximum",
									keyword: "maximum",
									params: {
										comparison: "<=",
										limit: 200
									},
									message: "must be <= 200"
								}];
								return false;
							} else if (data2 < 1 || isNaN(data2)) {
								validate74.errors = [{
									instancePath: instancePath + "/limit",
									schemaPath: "#/properties/limit/minimum",
									keyword: "minimum",
									params: {
										comparison: ">=",
										limit: 1
									},
									message: "must be >= 1"
								}];
								return false;
							}
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.query !== void 0) {
							let data3 = data.query;
							if (typeof data3 === "string") {
								if (func1(data3) > 256) {
									validate74.errors = [{
										instancePath: instancePath + "/query",
										schemaPath: "#/properties/query/maxLength",
										keyword: "maxLength",
										params: { limit: 256 },
										message: "must NOT have more than 256 characters"
									}];
									return false;
								} else if (func1(data3) < 1) {
									validate74.errors = [{
										instancePath: instancePath + "/query",
										schemaPath: "#/properties/query/minLength",
										keyword: "minLength",
										params: { limit: 1 },
										message: "must NOT have fewer than 1 characters"
									}];
									return false;
								}
							} else {
								validate74.errors = [{
									instancePath: instancePath + "/query",
									schemaPath: "#/properties/query/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.search_id !== void 0) {
								if (typeof data.search_id !== "string") {
									validate74.errors = [{
										instancePath: instancePath + "/search_id",
										schemaPath: "#/properties/search_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
						}
					}
				}
			}
		}
	} else {
		validate74.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate74.errors = vErrors;
	return true;
}
validate74.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateChatSearchResponse = validate75;
var schema112 = {
	"enum": ["0.3"],
	"type": "string"
};
var schema108 = {
	"additionalProperties": false,
	"properties": {
		"data_generation_id": { "type": "string" },
		"has_more": { "type": "boolean" },
		"items": {
			"items": { "$ref": "#/$defs/SearchHit" },
			"type": "array"
		},
		"next_cursor": { "type": ["string", "null"] },
		"query": { "type": "string" },
		"search_id": { "type": "string" },
		"semantics": { "$ref": "#/$defs/SearchSemantics" }
	},
	"required": [
		"data_generation_id",
		"search_id",
		"query",
		"semantics",
		"items",
		"has_more",
		"next_cursor"
	],
	"type": "object"
};
var schema111 = {
	"enum": ["literal_unicode_substring"],
	"type": "string"
};
function validate78(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate78.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.message_id === void 0 && (missing0 = "message_id") || data.seq === void 0 && (missing0 = "seq") || data.sender_display_name === void 0 && (missing0 = "sender_display_name") || data.snippet === void 0 && (missing0 = "snippet") || data.created_at === void 0 && (missing0 = "created_at")) {
			validate78.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "created_at" || key0 === "message_id" || key0 === "sender_display_name" || key0 === "seq" || key0 === "snippet")) {
				validate78.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.created_at !== void 0) {
				let data0 = data.created_at;
				if (!(typeof data0 == "number" && !(data0 % 1) && !isNaN(data0) && isFinite(data0))) {
					validate78.errors = [{
						instancePath: instancePath + "/created_at",
						schemaPath: "#/properties/created_at/type",
						keyword: "type",
						params: { type: "integer" },
						message: "must be integer"
					}];
					return false;
				}
				if (typeof data0 == "number" && isFinite(data0)) {
					if (data0 > 9007199254740991 || isNaN(data0)) {
						validate78.errors = [{
							instancePath: instancePath + "/created_at",
							schemaPath: "#/properties/created_at/maximum",
							keyword: "maximum",
							params: {
								comparison: "<=",
								limit: 9007199254740991
							},
							message: "must be <= 9007199254740991"
						}];
						return false;
					} else if (data0 < -9007199254740991 || isNaN(data0)) {
						validate78.errors = [{
							instancePath: instancePath + "/created_at",
							schemaPath: "#/properties/created_at/minimum",
							keyword: "minimum",
							params: {
								comparison: ">=",
								limit: -9007199254740991
							},
							message: "must be >= -9007199254740991"
						}];
						return false;
					}
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.message_id !== void 0) {
					if (typeof data.message_id !== "string") {
						validate78.errors = [{
							instancePath: instancePath + "/message_id",
							schemaPath: "#/properties/message_id/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.sender_display_name !== void 0) {
						if (typeof data.sender_display_name !== "string") {
							validate78.errors = [{
								instancePath: instancePath + "/sender_display_name",
								schemaPath: "#/properties/sender_display_name/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.seq !== void 0) {
							let data3 = data.seq;
							if (typeof data3 === "string") {
								if (func1(data3) > 19) {
									validate78.errors = [{
										instancePath: instancePath + "/seq",
										schemaPath: "#/$defs/DecimalString/maxLength",
										keyword: "maxLength",
										params: { limit: 19 },
										message: "must NOT have more than 19 characters"
									}];
									return false;
								} else if (!pattern4.test(data3)) {
									validate78.errors = [{
										instancePath: instancePath + "/seq",
										schemaPath: "#/$defs/DecimalString/pattern",
										keyword: "pattern",
										params: { pattern: "^(0|[1-9][0-9]*)$" },
										message: "must match pattern \"^(0|[1-9][0-9]*)$\""
									}];
									return false;
								}
							} else {
								validate78.errors = [{
									instancePath: instancePath + "/seq",
									schemaPath: "#/$defs/DecimalString/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.snippet !== void 0) {
								if (typeof data.snippet !== "string") {
									validate78.errors = [{
										instancePath: instancePath + "/snippet",
										schemaPath: "#/properties/snippet/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
						}
					}
				}
			}
		}
	} else {
		validate78.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate78.errors = vErrors;
	return true;
}
validate78.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate77(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate77.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.search_id === void 0 && (missing0 = "search_id") || data.query === void 0 && (missing0 = "query") || data.semantics === void 0 && (missing0 = "semantics") || data.items === void 0 && (missing0 = "items") || data.has_more === void 0 && (missing0 = "has_more") || data.next_cursor === void 0 && (missing0 = "next_cursor")) {
				validate77.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "has_more" || key0 === "items" || key0 === "next_cursor" || key0 === "query" || key0 === "search_id" || key0 === "semantics")) {
					validate77.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.data_generation_id !== void 0) {
						const _errs2 = errors;
						if (typeof data.data_generation_id !== "string") {
							validate77.errors = [{
								instancePath: instancePath + "/data_generation_id",
								schemaPath: "#/properties/data_generation_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.has_more !== void 0) {
							const _errs4 = errors;
							if (typeof data.has_more !== "boolean") {
								validate77.errors = [{
									instancePath: instancePath + "/has_more",
									schemaPath: "#/properties/has_more/type",
									keyword: "type",
									params: { type: "boolean" },
									message: "must be boolean"
								}];
								return false;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.items !== void 0) {
								let data2 = data.items;
								const _errs6 = errors;
								if (errors === _errs6) {
									if (Array.isArray(data2)) {
										const len0 = data2.length;
										for (let i0 = 0; i0 < len0; i0++) {
											const _errs8 = errors;
											if (!validate78(data2[i0], {
												instancePath: instancePath + "/items/" + i0,
												parentData: data2,
												parentDataProperty: i0,
												rootData,
												dynamicAnchors
											})) {
												vErrors = vErrors === null ? validate78.errors : vErrors.concat(validate78.errors);
												errors = vErrors.length;
											}
											if (!(_errs8 === errors)) break;
										}
									} else {
										validate77.errors = [{
											instancePath: instancePath + "/items",
											schemaPath: "#/properties/items/type",
											keyword: "type",
											params: { type: "array" },
											message: "must be array"
										}];
										return false;
									}
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.next_cursor !== void 0) {
									let data4 = data.next_cursor;
									const _errs9 = errors;
									if (typeof data4 !== "string" && data4 !== null) {
										validate77.errors = [{
											instancePath: instancePath + "/next_cursor",
											schemaPath: "#/properties/next_cursor/type",
											keyword: "type",
											params: { type: schema108.properties.next_cursor.type },
											message: "must be string,null"
										}];
										return false;
									}
									var valid0 = _errs9 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.query !== void 0) {
										const _errs11 = errors;
										if (typeof data.query !== "string") {
											validate77.errors = [{
												instancePath: instancePath + "/query",
												schemaPath: "#/properties/query/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											}];
											return false;
										}
										var valid0 = _errs11 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.search_id !== void 0) {
											const _errs13 = errors;
											if (typeof data.search_id !== "string") {
												validate77.errors = [{
													instancePath: instancePath + "/search_id",
													schemaPath: "#/properties/search_id/type",
													keyword: "type",
													params: { type: "string" },
													message: "must be string"
												}];
												return false;
											}
											var valid0 = _errs13 === errors;
										} else var valid0 = true;
										if (valid0) {
											if (data.semantics !== void 0) {
												let data7 = data.semantics;
												const _errs15 = errors;
												if (typeof data7 !== "string") {
													validate77.errors = [{
														instancePath: instancePath + "/semantics",
														schemaPath: "#/$defs/SearchSemantics/type",
														keyword: "type",
														params: { type: "string" },
														message: "must be string"
													}];
													return false;
												}
												if (!(data7 === "literal_unicode_substring")) {
													validate77.errors = [{
														instancePath: instancePath + "/semantics",
														schemaPath: "#/$defs/SearchSemantics/enum",
														keyword: "enum",
														params: { allowedValues: schema111.enum },
														message: "must be equal to one of the allowed values"
													}];
													return false;
												}
												var valid0 = _errs15 === errors;
											} else var valid0 = true;
										}
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate77.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate77.errors = vErrors;
	return errors === 0;
}
validate77.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate76(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate76.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate76.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "data" || key0 === "schema_version")) {
					validate76.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.data !== void 0) {
						const _errs2 = errors;
						if (!validate77(data.data, {
							instancePath: instancePath + "/data",
							parentData: data,
							parentDataProperty: "data",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate77.errors : vErrors.concat(validate77.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate76.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate76.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema112.enum },
									message: "must be equal to one of the allowed values"
								}];
								return false;
							}
							var valid0 = _errs3 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate76.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate76.errors = vErrors;
	return errors === 0;
}
validate76.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema114 = {
	"additionalProperties": false,
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"field_path": { "type": ["string", "null"] },
		"may_have_been_charged": { "type": "boolean" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"trace_id": { "type": "string" }
	},
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	],
	"type": "object"
};
var schema115 = {
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	],
	"type": "string"
};
var schema116 = {
	"enum": [
		"never",
		"retry",
		"after_user_action"
	],
	"type": "string"
};
function validate83(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate83.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate83.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "field_path" || key0 === "may_have_been_charged" || key0 === "message" || key0 === "retryability" || key0 === "trace_id")) {
				validate83.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate83.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate83.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema115.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.field_path !== void 0) {
					let data1 = data.field_path;
					if (typeof data1 !== "string" && data1 !== null) {
						validate83.errors = [{
							instancePath: instancePath + "/field_path",
							schemaPath: "#/properties/field_path/type",
							keyword: "type",
							params: { type: schema114.properties.field_path.type },
							message: "must be string,null"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.may_have_been_charged !== void 0) {
						if (typeof data.may_have_been_charged !== "boolean") {
							validate83.errors = [{
								instancePath: instancePath + "/may_have_been_charged",
								schemaPath: "#/properties/may_have_been_charged/type",
								keyword: "type",
								params: { type: "boolean" },
								message: "must be boolean"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.message !== void 0) {
							if (typeof data.message !== "string") {
								validate83.errors = [{
									instancePath: instancePath + "/message",
									schemaPath: "#/properties/message/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.retryability !== void 0) {
								let data4 = data.retryability;
								if (typeof data4 !== "string") {
									validate83.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "never" || data4 === "retry" || data4 === "after_user_action")) {
									validate83.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/enum",
										keyword: "enum",
										params: { allowedValues: schema116.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.trace_id !== void 0) {
									if (typeof data.trace_id !== "string") {
										validate83.errors = [{
											instancePath: instancePath + "/trace_id",
											schemaPath: "#/properties/trace_id/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate83.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate83.errors = vErrors;
	return true;
}
validate83.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate82(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate82.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate82.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "error" || key0 === "schema_version")) {
					validate82.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.error !== void 0) {
						const _errs2 = errors;
						if (!validate83(data.error, {
							instancePath: instancePath + "/error",
							parentData: data,
							parentDataProperty: "error",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate83.errors : vErrors.concat(validate83.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate82.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate82.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema112.enum },
									message: "must be equal to one of the allowed values"
								}];
								return false;
							}
							var valid0 = _errs3 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate82.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate82.errors = vErrors;
	return errors === 0;
}
validate82.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate75(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate75.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate76(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate76.errors : vErrors.concat(validate76.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate82(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate82.errors : vErrors.concat(validate82.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate75.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate75.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate75.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateChatSendRequest = validate86;
var schema118 = {
	"$defs": { "MessagePart": { "oneOf": [
		{
			"additionalProperties": false,
			"properties": {
				"kind": {
					"const": "text",
					"type": "string"
				},
				"text": { "type": "string" }
			},
			"required": ["kind", "text"],
			"type": "object"
		},
		{
			"additionalProperties": false,
			"properties": {
				"attachment_id": { "type": "string" },
				"kind": {
					"const": "attachment",
					"type": "string"
				}
			},
			"required": ["kind", "attachment_id"],
			"type": "object"
		},
		{
			"additionalProperties": false,
			"properties": {
				"emote_id": { "type": "string" },
				"kind": {
					"const": "emote",
					"type": "string"
				}
			},
			"required": ["kind", "emote_id"],
			"type": "object"
		}
	] } },
	"$schema": "https://json-schema.org/draft/2020-12/schema",
	"additionalProperties": false,
	"properties": {
		"client_request_id": { "type": "string" },
		"data_generation_id": { "type": "string" },
		"mention_all": { "type": "boolean" },
		"mention_ids": {
			"items": { "type": "string" },
			"type": "array"
		},
		"parts": {
			"items": { "$ref": "#/$defs/MessagePart" },
			"type": "array"
		},
		"quote_message_id": {
			"default": null,
			"type": ["string", "null"]
		}
	},
	"required": [
		"data_generation_id",
		"client_request_id",
		"parts",
		"mention_ids",
		"mention_all"
	],
	"title": "ChatSendRequest",
	"type": "object"
};
function validate86(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate86.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.client_request_id === void 0 && (missing0 = "client_request_id") || data.parts === void 0 && (missing0 = "parts") || data.mention_ids === void 0 && (missing0 = "mention_ids") || data.mention_all === void 0 && (missing0 = "mention_all")) {
				validate86.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "client_request_id" || key0 === "data_generation_id" || key0 === "mention_all" || key0 === "mention_ids" || key0 === "parts" || key0 === "quote_message_id")) {
					validate86.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.client_request_id !== void 0) {
						const _errs2 = errors;
						if (typeof data.client_request_id !== "string") {
							validate86.errors = [{
								instancePath: instancePath + "/client_request_id",
								schemaPath: "#/properties/client_request_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.data_generation_id !== void 0) {
							const _errs4 = errors;
							if (typeof data.data_generation_id !== "string") {
								validate86.errors = [{
									instancePath: instancePath + "/data_generation_id",
									schemaPath: "#/properties/data_generation_id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.mention_all !== void 0) {
								const _errs6 = errors;
								if (typeof data.mention_all !== "boolean") {
									validate86.errors = [{
										instancePath: instancePath + "/mention_all",
										schemaPath: "#/properties/mention_all/type",
										keyword: "type",
										params: { type: "boolean" },
										message: "must be boolean"
									}];
									return false;
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.mention_ids !== void 0) {
									let data3 = data.mention_ids;
									const _errs8 = errors;
									if (errors === _errs8) {
										if (Array.isArray(data3)) {
											const len0 = data3.length;
											for (let i0 = 0; i0 < len0; i0++) {
												const _errs10 = errors;
												if (typeof data3[i0] !== "string") {
													validate86.errors = [{
														instancePath: instancePath + "/mention_ids/" + i0,
														schemaPath: "#/properties/mention_ids/items/type",
														keyword: "type",
														params: { type: "string" },
														message: "must be string"
													}];
													return false;
												}
												if (!(_errs10 === errors)) break;
											}
										} else {
											validate86.errors = [{
												instancePath: instancePath + "/mention_ids",
												schemaPath: "#/properties/mention_ids/type",
												keyword: "type",
												params: { type: "array" },
												message: "must be array"
											}];
											return false;
										}
									}
									var valid0 = _errs8 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.parts !== void 0) {
										let data5 = data.parts;
										const _errs12 = errors;
										if (errors === _errs12) {
											if (Array.isArray(data5)) {
												const len1 = data5.length;
												for (let i1 = 0; i1 < len1; i1++) {
													let data6 = data5[i1];
													const _errs14 = errors;
													const _errs16 = errors;
													let valid4 = false;
													let passing0 = null;
													const _errs17 = errors;
													if (errors === _errs17) {
														if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
															let missing1;
															if (data6.kind === void 0 && (missing1 = "kind") || data6.text === void 0 && (missing1 = "text")) {
																const err0 = {
																	instancePath: instancePath + "/parts/" + i1,
																	schemaPath: "#/$defs/MessagePart/oneOf/0/required",
																	keyword: "required",
																	params: { missingProperty: missing1 },
																	message: "must have required property '" + missing1 + "'"
																};
																if (vErrors === null) vErrors = [err0];
																else vErrors.push(err0);
																errors++;
															} else {
																const _errs19 = errors;
																for (const key1 in data6) if (!(key1 === "kind" || key1 === "text")) {
																	const err1 = {
																		instancePath: instancePath + "/parts/" + i1,
																		schemaPath: "#/$defs/MessagePart/oneOf/0/additionalProperties",
																		keyword: "additionalProperties",
																		params: { additionalProperty: key1 },
																		message: "must NOT have additional properties"
																	};
																	if (vErrors === null) vErrors = [err1];
																	else vErrors.push(err1);
																	errors++;
																	break;
																}
																if (_errs19 === errors) {
																	if (data6.kind !== void 0) {
																		let data7 = data6.kind;
																		const _errs20 = errors;
																		if (typeof data7 !== "string") {
																			const err2 = {
																				instancePath: instancePath + "/parts/" + i1 + "/kind",
																				schemaPath: "#/$defs/MessagePart/oneOf/0/properties/kind/type",
																				keyword: "type",
																				params: { type: "string" },
																				message: "must be string"
																			};
																			if (vErrors === null) vErrors = [err2];
																			else vErrors.push(err2);
																			errors++;
																		}
																		if ("text" !== data7) {
																			const err3 = {
																				instancePath: instancePath + "/parts/" + i1 + "/kind",
																				schemaPath: "#/$defs/MessagePart/oneOf/0/properties/kind/const",
																				keyword: "const",
																				params: { allowedValue: "text" },
																				message: "must be equal to constant"
																			};
																			if (vErrors === null) vErrors = [err3];
																			else vErrors.push(err3);
																			errors++;
																		}
																		var valid5 = _errs20 === errors;
																	} else var valid5 = true;
																	if (valid5) {
																		if (data6.text !== void 0) {
																			const _errs22 = errors;
																			if (typeof data6.text !== "string") {
																				const err4 = {
																					instancePath: instancePath + "/parts/" + i1 + "/text",
																					schemaPath: "#/$defs/MessagePart/oneOf/0/properties/text/type",
																					keyword: "type",
																					params: { type: "string" },
																					message: "must be string"
																				};
																				if (vErrors === null) vErrors = [err4];
																				else vErrors.push(err4);
																				errors++;
																			}
																			var valid5 = _errs22 === errors;
																		} else var valid5 = true;
																	}
																}
															}
														} else {
															const err5 = {
																instancePath: instancePath + "/parts/" + i1,
																schemaPath: "#/$defs/MessagePart/oneOf/0/type",
																keyword: "type",
																params: { type: "object" },
																message: "must be object"
															};
															if (vErrors === null) vErrors = [err5];
															else vErrors.push(err5);
															errors++;
														}
													}
													var _valid0 = _errs17 === errors;
													if (_valid0) {
														valid4 = true;
														passing0 = 0;
														var props0 = true;
													}
													const _errs24 = errors;
													if (errors === _errs24) {
														if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
															let missing2;
															if (data6.kind === void 0 && (missing2 = "kind") || data6.attachment_id === void 0 && (missing2 = "attachment_id")) {
																const err6 = {
																	instancePath: instancePath + "/parts/" + i1,
																	schemaPath: "#/$defs/MessagePart/oneOf/1/required",
																	keyword: "required",
																	params: { missingProperty: missing2 },
																	message: "must have required property '" + missing2 + "'"
																};
																if (vErrors === null) vErrors = [err6];
																else vErrors.push(err6);
																errors++;
															} else {
																const _errs26 = errors;
																for (const key2 in data6) if (!(key2 === "attachment_id" || key2 === "kind")) {
																	const err7 = {
																		instancePath: instancePath + "/parts/" + i1,
																		schemaPath: "#/$defs/MessagePart/oneOf/1/additionalProperties",
																		keyword: "additionalProperties",
																		params: { additionalProperty: key2 },
																		message: "must NOT have additional properties"
																	};
																	if (vErrors === null) vErrors = [err7];
																	else vErrors.push(err7);
																	errors++;
																	break;
																}
																if (_errs26 === errors) {
																	if (data6.attachment_id !== void 0) {
																		const _errs27 = errors;
																		if (typeof data6.attachment_id !== "string") {
																			const err8 = {
																				instancePath: instancePath + "/parts/" + i1 + "/attachment_id",
																				schemaPath: "#/$defs/MessagePart/oneOf/1/properties/attachment_id/type",
																				keyword: "type",
																				params: { type: "string" },
																				message: "must be string"
																			};
																			if (vErrors === null) vErrors = [err8];
																			else vErrors.push(err8);
																			errors++;
																		}
																		var valid6 = _errs27 === errors;
																	} else var valid6 = true;
																	if (valid6) {
																		if (data6.kind !== void 0) {
																			let data10 = data6.kind;
																			const _errs29 = errors;
																			if (typeof data10 !== "string") {
																				const err9 = {
																					instancePath: instancePath + "/parts/" + i1 + "/kind",
																					schemaPath: "#/$defs/MessagePart/oneOf/1/properties/kind/type",
																					keyword: "type",
																					params: { type: "string" },
																					message: "must be string"
																				};
																				if (vErrors === null) vErrors = [err9];
																				else vErrors.push(err9);
																				errors++;
																			}
																			if ("attachment" !== data10) {
																				const err10 = {
																					instancePath: instancePath + "/parts/" + i1 + "/kind",
																					schemaPath: "#/$defs/MessagePart/oneOf/1/properties/kind/const",
																					keyword: "const",
																					params: { allowedValue: "attachment" },
																					message: "must be equal to constant"
																				};
																				if (vErrors === null) vErrors = [err10];
																				else vErrors.push(err10);
																				errors++;
																			}
																			var valid6 = _errs29 === errors;
																		} else var valid6 = true;
																	}
																}
															}
														} else {
															const err11 = {
																instancePath: instancePath + "/parts/" + i1,
																schemaPath: "#/$defs/MessagePart/oneOf/1/type",
																keyword: "type",
																params: { type: "object" },
																message: "must be object"
															};
															if (vErrors === null) vErrors = [err11];
															else vErrors.push(err11);
															errors++;
														}
													}
													var _valid0 = _errs24 === errors;
													if (_valid0 && valid4) {
														valid4 = false;
														passing0 = [passing0, 1];
													} else {
														if (_valid0) {
															valid4 = true;
															passing0 = 1;
															if (props0 !== true) props0 = true;
														}
														const _errs31 = errors;
														if (errors === _errs31) {
															if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
																let missing3;
																if (data6.kind === void 0 && (missing3 = "kind") || data6.emote_id === void 0 && (missing3 = "emote_id")) {
																	const err12 = {
																		instancePath: instancePath + "/parts/" + i1,
																		schemaPath: "#/$defs/MessagePart/oneOf/2/required",
																		keyword: "required",
																		params: { missingProperty: missing3 },
																		message: "must have required property '" + missing3 + "'"
																	};
																	if (vErrors === null) vErrors = [err12];
																	else vErrors.push(err12);
																	errors++;
																} else {
																	const _errs33 = errors;
																	for (const key3 in data6) if (!(key3 === "emote_id" || key3 === "kind")) {
																		const err13 = {
																			instancePath: instancePath + "/parts/" + i1,
																			schemaPath: "#/$defs/MessagePart/oneOf/2/additionalProperties",
																			keyword: "additionalProperties",
																			params: { additionalProperty: key3 },
																			message: "must NOT have additional properties"
																		};
																		if (vErrors === null) vErrors = [err13];
																		else vErrors.push(err13);
																		errors++;
																		break;
																	}
																	if (_errs33 === errors) {
																		if (data6.emote_id !== void 0) {
																			const _errs34 = errors;
																			if (typeof data6.emote_id !== "string") {
																				const err14 = {
																					instancePath: instancePath + "/parts/" + i1 + "/emote_id",
																					schemaPath: "#/$defs/MessagePart/oneOf/2/properties/emote_id/type",
																					keyword: "type",
																					params: { type: "string" },
																					message: "must be string"
																				};
																				if (vErrors === null) vErrors = [err14];
																				else vErrors.push(err14);
																				errors++;
																			}
																			var valid7 = _errs34 === errors;
																		} else var valid7 = true;
																		if (valid7) {
																			if (data6.kind !== void 0) {
																				let data12 = data6.kind;
																				const _errs36 = errors;
																				if (typeof data12 !== "string") {
																					const err15 = {
																						instancePath: instancePath + "/parts/" + i1 + "/kind",
																						schemaPath: "#/$defs/MessagePart/oneOf/2/properties/kind/type",
																						keyword: "type",
																						params: { type: "string" },
																						message: "must be string"
																					};
																					if (vErrors === null) vErrors = [err15];
																					else vErrors.push(err15);
																					errors++;
																				}
																				if ("emote" !== data12) {
																					const err16 = {
																						instancePath: instancePath + "/parts/" + i1 + "/kind",
																						schemaPath: "#/$defs/MessagePart/oneOf/2/properties/kind/const",
																						keyword: "const",
																						params: { allowedValue: "emote" },
																						message: "must be equal to constant"
																					};
																					if (vErrors === null) vErrors = [err16];
																					else vErrors.push(err16);
																					errors++;
																				}
																				var valid7 = _errs36 === errors;
																			} else var valid7 = true;
																		}
																	}
																}
															} else {
																const err17 = {
																	instancePath: instancePath + "/parts/" + i1,
																	schemaPath: "#/$defs/MessagePart/oneOf/2/type",
																	keyword: "type",
																	params: { type: "object" },
																	message: "must be object"
																};
																if (vErrors === null) vErrors = [err17];
																else vErrors.push(err17);
																errors++;
															}
														}
														var _valid0 = _errs31 === errors;
														if (_valid0 && valid4) {
															valid4 = false;
															passing0 = [passing0, 2];
														} else if (_valid0) {
															valid4 = true;
															passing0 = 2;
															if (props0 !== true) props0 = true;
														}
													}
													if (!valid4) {
														const err18 = {
															instancePath: instancePath + "/parts/" + i1,
															schemaPath: "#/$defs/MessagePart/oneOf",
															keyword: "oneOf",
															params: { passingSchemas: passing0 },
															message: "must match exactly one schema in oneOf"
														};
														if (vErrors === null) vErrors = [err18];
														else vErrors.push(err18);
														errors++;
														validate86.errors = vErrors;
														return false;
													} else {
														errors = _errs16;
														if (vErrors !== null) {
															if (_errs16) vErrors.length = _errs16;
															else vErrors = null;
														}
													}
													if (!(_errs14 === errors)) break;
												}
											} else {
												validate86.errors = [{
													instancePath: instancePath + "/parts",
													schemaPath: "#/properties/parts/type",
													keyword: "type",
													params: { type: "array" },
													message: "must be array"
												}];
												return false;
											}
										}
										var valid0 = _errs12 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.quote_message_id !== void 0) {
											let data13 = data.quote_message_id;
											const _errs38 = errors;
											if (typeof data13 !== "string" && data13 !== null) {
												validate86.errors = [{
													instancePath: instancePath + "/quote_message_id",
													schemaPath: "#/properties/quote_message_id/type",
													keyword: "type",
													params: { type: schema118.properties.quote_message_id.type },
													message: "must be string,null"
												}];
												return false;
											}
											var valid0 = _errs38 === errors;
										} else var valid0 = true;
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate86.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate86.errors = vErrors;
	return errors === 0;
}
validate86.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateChatSendResponse = validate87;
var schema125 = {
	"enum": ["0.3"],
	"type": "string"
};
function validate89(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate89.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.message_id === void 0 && (missing0 = "message_id") || data.message_seq === void 0 && (missing0 = "message_seq") || data.event_seq === void 0 && (missing0 = "event_seq")) {
			validate89.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "event_seq" || key0 === "message_id" || key0 === "message_seq")) {
				validate89.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.data_generation_id !== void 0) {
				if (typeof data.data_generation_id !== "string") {
					validate89.errors = [{
						instancePath: instancePath + "/data_generation_id",
						schemaPath: "#/properties/data_generation_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.event_seq !== void 0) {
					let data1 = data.event_seq;
					if (typeof data1 === "string") {
						if (func1(data1) > 19) {
							validate89.errors = [{
								instancePath: instancePath + "/event_seq",
								schemaPath: "#/$defs/DecimalString/maxLength",
								keyword: "maxLength",
								params: { limit: 19 },
								message: "must NOT have more than 19 characters"
							}];
							return false;
						} else if (!pattern4.test(data1)) {
							validate89.errors = [{
								instancePath: instancePath + "/event_seq",
								schemaPath: "#/$defs/DecimalString/pattern",
								keyword: "pattern",
								params: { pattern: "^(0|[1-9][0-9]*)$" },
								message: "must match pattern \"^(0|[1-9][0-9]*)$\""
							}];
							return false;
						}
					} else {
						validate89.errors = [{
							instancePath: instancePath + "/event_seq",
							schemaPath: "#/$defs/DecimalString/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.message_id !== void 0) {
						if (typeof data.message_id !== "string") {
							validate89.errors = [{
								instancePath: instancePath + "/message_id",
								schemaPath: "#/properties/message_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.message_seq !== void 0) {
							let data3 = data.message_seq;
							if (typeof data3 === "string") {
								if (func1(data3) > 19) {
									validate89.errors = [{
										instancePath: instancePath + "/message_seq",
										schemaPath: "#/$defs/DecimalString/maxLength",
										keyword: "maxLength",
										params: { limit: 19 },
										message: "must NOT have more than 19 characters"
									}];
									return false;
								} else if (!pattern4.test(data3)) {
									validate89.errors = [{
										instancePath: instancePath + "/message_seq",
										schemaPath: "#/$defs/DecimalString/pattern",
										keyword: "pattern",
										params: { pattern: "^(0|[1-9][0-9]*)$" },
										message: "must match pattern \"^(0|[1-9][0-9]*)$\""
									}];
									return false;
								}
							} else {
								validate89.errors = [{
									instancePath: instancePath + "/message_seq",
									schemaPath: "#/$defs/DecimalString/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
					}
				}
			}
		}
	} else {
		validate89.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate89.errors = vErrors;
	return true;
}
validate89.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate88(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate88.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate88.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "data" || key0 === "schema_version")) {
					validate88.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.data !== void 0) {
						const _errs2 = errors;
						if (!validate89(data.data, {
							instancePath: instancePath + "/data",
							parentData: data,
							parentDataProperty: "data",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate89.errors : vErrors.concat(validate89.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate88.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate88.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema125.enum },
									message: "must be equal to one of the allowed values"
								}];
								return false;
							}
							var valid0 = _errs3 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate88.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate88.errors = vErrors;
	return errors === 0;
}
validate88.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema127 = {
	"additionalProperties": false,
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"field_path": { "type": ["string", "null"] },
		"may_have_been_charged": { "type": "boolean" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"trace_id": { "type": "string" }
	},
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	],
	"type": "object"
};
var schema128 = {
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	],
	"type": "string"
};
var schema129 = {
	"enum": [
		"never",
		"retry",
		"after_user_action"
	],
	"type": "string"
};
function validate93(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate93.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate93.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "field_path" || key0 === "may_have_been_charged" || key0 === "message" || key0 === "retryability" || key0 === "trace_id")) {
				validate93.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate93.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate93.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema128.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.field_path !== void 0) {
					let data1 = data.field_path;
					if (typeof data1 !== "string" && data1 !== null) {
						validate93.errors = [{
							instancePath: instancePath + "/field_path",
							schemaPath: "#/properties/field_path/type",
							keyword: "type",
							params: { type: schema127.properties.field_path.type },
							message: "must be string,null"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.may_have_been_charged !== void 0) {
						if (typeof data.may_have_been_charged !== "boolean") {
							validate93.errors = [{
								instancePath: instancePath + "/may_have_been_charged",
								schemaPath: "#/properties/may_have_been_charged/type",
								keyword: "type",
								params: { type: "boolean" },
								message: "must be boolean"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.message !== void 0) {
							if (typeof data.message !== "string") {
								validate93.errors = [{
									instancePath: instancePath + "/message",
									schemaPath: "#/properties/message/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.retryability !== void 0) {
								let data4 = data.retryability;
								if (typeof data4 !== "string") {
									validate93.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "never" || data4 === "retry" || data4 === "after_user_action")) {
									validate93.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/enum",
										keyword: "enum",
										params: { allowedValues: schema129.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.trace_id !== void 0) {
									if (typeof data.trace_id !== "string") {
										validate93.errors = [{
											instancePath: instancePath + "/trace_id",
											schemaPath: "#/properties/trace_id/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate93.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate93.errors = vErrors;
	return true;
}
validate93.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate92(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate92.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate92.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "error" || key0 === "schema_version")) {
					validate92.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.error !== void 0) {
						const _errs2 = errors;
						if (!validate93(data.error, {
							instancePath: instancePath + "/error",
							parentData: data,
							parentDataProperty: "error",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate93.errors : vErrors.concat(validate93.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate92.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate92.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema125.enum },
									message: "must be equal to one of the allowed values"
								}];
								return false;
							}
							var valid0 = _errs3 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate92.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate92.errors = vErrors;
	return errors === 0;
}
validate92.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate87(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate87.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate88(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate88.errors : vErrors.concat(validate88.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate92(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate92.errors : vErrors.concat(validate92.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate87.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate87.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate87.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
var validateDomainEvent = validate96;
var schema138 = {
	"enum": ["0.3"],
	"type": "string"
};
var schema137 = {
	"enum": [
		"system",
		"light",
		"dark"
	],
	"type": "string"
};
function validate98(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate98.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.theme === void 0 && (missing0 = "theme") || data.reduce_motion === void 0 && (missing0 = "reduce_motion") || data.revision === void 0 && (missing0 = "revision")) {
			validate98.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "reduce_motion" || key0 === "revision" || key0 === "theme")) {
				validate98.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.reduce_motion !== void 0) {
				if (typeof data.reduce_motion !== "boolean") {
					validate98.errors = [{
						instancePath: instancePath + "/reduce_motion",
						schemaPath: "#/properties/reduce_motion/type",
						keyword: "type",
						params: { type: "boolean" },
						message: "must be boolean"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.revision !== void 0) {
					let data1 = data.revision;
					if (typeof data1 === "string") {
						if (func1(data1) > 19) {
							validate98.errors = [{
								instancePath: instancePath + "/revision",
								schemaPath: "#/$defs/DecimalString/maxLength",
								keyword: "maxLength",
								params: { limit: 19 },
								message: "must NOT have more than 19 characters"
							}];
							return false;
						} else if (!pattern4.test(data1)) {
							validate98.errors = [{
								instancePath: instancePath + "/revision",
								schemaPath: "#/$defs/DecimalString/pattern",
								keyword: "pattern",
								params: { pattern: "^(0|[1-9][0-9]*)$" },
								message: "must match pattern \"^(0|[1-9][0-9]*)$\""
							}];
							return false;
						}
					} else {
						validate98.errors = [{
							instancePath: instancePath + "/revision",
							schemaPath: "#/$defs/DecimalString/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.theme !== void 0) {
						let data2 = data.theme;
						if (typeof data2 !== "string") {
							validate98.errors = [{
								instancePath: instancePath + "/theme",
								schemaPath: "#/$defs/Theme/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "system" || data2 === "light" || data2 === "dark")) {
							validate98.errors = [{
								instancePath: instancePath + "/theme",
								schemaPath: "#/$defs/Theme/enum",
								keyword: "enum",
								params: { allowedValues: schema137.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
				}
			}
		}
	} else {
		validate98.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate98.errors = vErrors;
	return true;
}
validate98.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate97(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate97.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	let passing0 = null;
	const _errs1 = errors;
	if (errors === _errs1) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.kind === void 0 && (missing0 = "kind") || data.message_id === void 0 && (missing0 = "message_id") || data.message_seq === void 0 && (missing0 = "message_seq") || data.sender_id === void 0 && (missing0 = "sender_id")) {
				const err0 = {
					instancePath,
					schemaPath: "#/oneOf/0/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				};
				if (vErrors === null) vErrors = [err0];
				else vErrors.push(err0);
				errors++;
			} else {
				const _errs3 = errors;
				for (const key0 in data) if (!(key0 === "kind" || key0 === "message_id" || key0 === "message_seq" || key0 === "sender_id")) {
					const err1 = {
						instancePath,
						schemaPath: "#/oneOf/0/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					};
					if (vErrors === null) vErrors = [err1];
					else vErrors.push(err1);
					errors++;
					break;
				}
				if (_errs3 === errors) {
					if (data.kind !== void 0) {
						let data0 = data.kind;
						const _errs4 = errors;
						if (typeof data0 !== "string") {
							const err2 = {
								instancePath: instancePath + "/kind",
								schemaPath: "#/oneOf/0/properties/kind/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							};
							if (vErrors === null) vErrors = [err2];
							else vErrors.push(err2);
							errors++;
						}
						if ("message_committed" !== data0) {
							const err3 = {
								instancePath: instancePath + "/kind",
								schemaPath: "#/oneOf/0/properties/kind/const",
								keyword: "const",
								params: { allowedValue: "message_committed" },
								message: "must be equal to constant"
							};
							if (vErrors === null) vErrors = [err3];
							else vErrors.push(err3);
							errors++;
						}
						var valid1 = _errs4 === errors;
					} else var valid1 = true;
					if (valid1) {
						if (data.message_id !== void 0) {
							const _errs6 = errors;
							if (typeof data.message_id !== "string") {
								const err4 = {
									instancePath: instancePath + "/message_id",
									schemaPath: "#/oneOf/0/properties/message_id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								};
								if (vErrors === null) vErrors = [err4];
								else vErrors.push(err4);
								errors++;
							}
							var valid1 = _errs6 === errors;
						} else var valid1 = true;
						if (valid1) {
							if (data.message_seq !== void 0) {
								let data2 = data.message_seq;
								const _errs8 = errors;
								if (errors === errors) {
									if (typeof data2 === "string") {
										if (func1(data2) > 19) {
											const err5 = {
												instancePath: instancePath + "/message_seq",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											};
											if (vErrors === null) vErrors = [err5];
											else vErrors.push(err5);
											errors++;
										} else if (!pattern4.test(data2)) {
											const err6 = {
												instancePath: instancePath + "/message_seq",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											};
											if (vErrors === null) vErrors = [err6];
											else vErrors.push(err6);
											errors++;
										}
									} else {
										const err7 = {
											instancePath: instancePath + "/message_seq",
											schemaPath: "#/$defs/DecimalString/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										};
										if (vErrors === null) vErrors = [err7];
										else vErrors.push(err7);
										errors++;
									}
								}
								var valid1 = _errs8 === errors;
							} else var valid1 = true;
							if (valid1) {
								if (data.sender_id !== void 0) {
									const _errs11 = errors;
									if (typeof data.sender_id !== "string") {
										const err8 = {
											instancePath: instancePath + "/sender_id",
											schemaPath: "#/oneOf/0/properties/sender_id/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										};
										if (vErrors === null) vErrors = [err8];
										else vErrors.push(err8);
										errors++;
									}
									var valid1 = _errs11 === errors;
								} else var valid1 = true;
							}
						}
					}
				}
			}
		} else {
			const err9 = {
				instancePath,
				schemaPath: "#/oneOf/0/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			};
			if (vErrors === null) vErrors = [err9];
			else vErrors.push(err9);
			errors++;
		}
	}
	var _valid0 = _errs1 === errors;
	if (_valid0) {
		valid0 = true;
		passing0 = 0;
		var props0 = true;
	}
	const _errs13 = errors;
	if (errors === _errs13) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing1;
			if (data.kind === void 0 && (missing1 = "kind") || data.appearance === void 0 && (missing1 = "appearance")) {
				const err10 = {
					instancePath,
					schemaPath: "#/oneOf/1/required",
					keyword: "required",
					params: { missingProperty: missing1 },
					message: "must have required property '" + missing1 + "'"
				};
				if (vErrors === null) vErrors = [err10];
				else vErrors.push(err10);
				errors++;
			} else {
				const _errs15 = errors;
				for (const key1 in data) if (!(key1 === "appearance" || key1 === "kind")) {
					const err11 = {
						instancePath,
						schemaPath: "#/oneOf/1/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key1 },
						message: "must NOT have additional properties"
					};
					if (vErrors === null) vErrors = [err11];
					else vErrors.push(err11);
					errors++;
					break;
				}
				if (_errs15 === errors) {
					if (data.appearance !== void 0) {
						const _errs16 = errors;
						if (!validate98(data.appearance, {
							instancePath: instancePath + "/appearance",
							parentData: data,
							parentDataProperty: "appearance",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate98.errors : vErrors.concat(validate98.errors);
							errors = vErrors.length;
						}
						var valid3 = _errs16 === errors;
					} else var valid3 = true;
					if (valid3) {
						if (data.kind !== void 0) {
							let data5 = data.kind;
							const _errs17 = errors;
							if (typeof data5 !== "string") {
								const err12 = {
									instancePath: instancePath + "/kind",
									schemaPath: "#/oneOf/1/properties/kind/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								};
								if (vErrors === null) vErrors = [err12];
								else vErrors.push(err12);
								errors++;
							}
							if ("appearance_changed" !== data5) {
								const err13 = {
									instancePath: instancePath + "/kind",
									schemaPath: "#/oneOf/1/properties/kind/const",
									keyword: "const",
									params: { allowedValue: "appearance_changed" },
									message: "must be equal to constant"
								};
								if (vErrors === null) vErrors = [err13];
								else vErrors.push(err13);
								errors++;
							}
							var valid3 = _errs17 === errors;
						} else var valid3 = true;
					}
				}
			}
		} else {
			const err14 = {
				instancePath,
				schemaPath: "#/oneOf/1/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			};
			if (vErrors === null) vErrors = [err14];
			else vErrors.push(err14);
			errors++;
		}
	}
	var _valid0 = _errs13 === errors;
	if (_valid0 && valid0) {
		valid0 = false;
		passing0 = [passing0, 1];
	} else if (_valid0) {
		valid0 = true;
		passing0 = 1;
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err15 = {
			instancePath,
			schemaPath: "#/oneOf",
			keyword: "oneOf",
			params: { passingSchemas: passing0 },
			message: "must match exactly one schema in oneOf"
		};
		if (vErrors === null) vErrors = [err15];
		else vErrors.push(err15);
		errors++;
		validate97.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate97.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate97.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
function validate96(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate96.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.event_seq === void 0 && (missing0 = "event_seq") || data.event_id === void 0 && (missing0 = "event_id") || data.occurred_at === void 0 && (missing0 = "occurred_at") || data.payload === void 0 && (missing0 = "payload")) {
				validate96.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "event_id" || key0 === "event_seq" || key0 === "occurred_at" || key0 === "payload" || key0 === "schema_version")) {
					validate96.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.data_generation_id !== void 0) {
						const _errs2 = errors;
						if (typeof data.data_generation_id !== "string") {
							validate96.errors = [{
								instancePath: instancePath + "/data_generation_id",
								schemaPath: "#/properties/data_generation_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.event_id !== void 0) {
							const _errs4 = errors;
							if (typeof data.event_id !== "string") {
								validate96.errors = [{
									instancePath: instancePath + "/event_id",
									schemaPath: "#/properties/event_id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.event_seq !== void 0) {
								let data2 = data.event_seq;
								const _errs6 = errors;
								if (errors === errors) {
									if (typeof data2 === "string") {
										if (func1(data2) > 19) {
											validate96.errors = [{
												instancePath: instancePath + "/event_seq",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											}];
											return false;
										} else if (!pattern4.test(data2)) {
											validate96.errors = [{
												instancePath: instancePath + "/event_seq",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											}];
											return false;
										}
									} else {
										validate96.errors = [{
											instancePath: instancePath + "/event_seq",
											schemaPath: "#/$defs/DecimalString/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.occurred_at !== void 0) {
									let data3 = data.occurred_at;
									const _errs9 = errors;
									if (!(typeof data3 == "number" && !(data3 % 1) && !isNaN(data3) && isFinite(data3))) {
										validate96.errors = [{
											instancePath: instancePath + "/occurred_at",
											schemaPath: "#/properties/occurred_at/type",
											keyword: "type",
											params: { type: "integer" },
											message: "must be integer"
										}];
										return false;
									}
									if (errors === _errs9) {
										if (typeof data3 == "number" && isFinite(data3)) {
											if (data3 > 9007199254740991 || isNaN(data3)) {
												validate96.errors = [{
													instancePath: instancePath + "/occurred_at",
													schemaPath: "#/properties/occurred_at/maximum",
													keyword: "maximum",
													params: {
														comparison: "<=",
														limit: 9007199254740991
													},
													message: "must be <= 9007199254740991"
												}];
												return false;
											} else if (data3 < -9007199254740991 || isNaN(data3)) {
												validate96.errors = [{
													instancePath: instancePath + "/occurred_at",
													schemaPath: "#/properties/occurred_at/minimum",
													keyword: "minimum",
													params: {
														comparison: ">=",
														limit: -9007199254740991
													},
													message: "must be >= -9007199254740991"
												}];
												return false;
											}
										}
									}
									var valid0 = _errs9 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.payload !== void 0) {
										const _errs11 = errors;
										if (!validate97(data.payload, {
											instancePath: instancePath + "/payload",
											parentData: data,
											parentDataProperty: "payload",
											rootData,
											dynamicAnchors
										})) {
											vErrors = vErrors === null ? validate97.errors : vErrors.concat(validate97.errors);
											errors = vErrors.length;
										}
										var valid0 = _errs11 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.schema_version !== void 0) {
											let data5 = data.schema_version;
											const _errs12 = errors;
											if (typeof data5 !== "string") {
												validate96.errors = [{
													instancePath: instancePath + "/schema_version",
													schemaPath: "#/$defs/SchemaVersion/type",
													keyword: "type",
													params: { type: "string" },
													message: "must be string"
												}];
												return false;
											}
											if (!(data5 === "0.3")) {
												validate96.errors = [{
													instancePath: instancePath + "/schema_version",
													schemaPath: "#/$defs/SchemaVersion/enum",
													keyword: "enum",
													params: { allowedValues: schema138.enum },
													message: "must be equal to one of the allowed values"
												}];
												return false;
											}
											var valid0 = _errs12 === errors;
										} else var valid0 = true;
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate96.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate96.errors = vErrors;
	return errors === 0;
}
validate96.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateExitRequest = validate101;
var schema139 = {
	"$schema": "https://json-schema.org/draft/2020-12/schema",
	"additionalProperties": false,
	"properties": { "data_generation_id": {
		"default": null,
		"type": ["string", "null"]
	} },
	"title": "ExitRequest",
	"type": "object"
};
function validate101(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate101.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		for (const key0 in data) if (!(key0 === "data_generation_id")) {
			validate101.errors = [{
				instancePath,
				schemaPath: "#/additionalProperties",
				keyword: "additionalProperties",
				params: { additionalProperty: key0 },
				message: "must NOT have additional properties"
			}];
			return false;
		}
		if (data.data_generation_id !== void 0) {
			let data0 = data.data_generation_id;
			if (typeof data0 !== "string" && data0 !== null) {
				validate101.errors = [{
					instancePath: instancePath + "/data_generation_id",
					schemaPath: "#/properties/data_generation_id/type",
					keyword: "type",
					params: { type: schema139.properties.data_generation_id.type },
					message: "must be string,null"
				}];
				return false;
			}
		}
	} else {
		validate101.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate101.errors = vErrors;
	return true;
}
validate101.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var validateExitResponse = validate102;
var schema143 = {
	"enum": ["0.3"],
	"type": "string"
};
function validate103(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate103.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
			validate103.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data" || key0 === "schema_version")) {
				validate103.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.data !== void 0) {
				let data0 = data.data;
				if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
					let missing1;
					if (data0.shutting_down === void 0 && (missing1 = "shutting_down")) {
						validate103.errors = [{
							instancePath: instancePath + "/data",
							schemaPath: "#/$defs/ExitResult/required",
							keyword: "required",
							params: { missingProperty: missing1 },
							message: "must have required property '" + missing1 + "'"
						}];
						return false;
					} else {
						for (const key1 in data0) if (!(key1 === "shutting_down")) {
							validate103.errors = [{
								instancePath: instancePath + "/data",
								schemaPath: "#/$defs/ExitResult/additionalProperties",
								keyword: "additionalProperties",
								params: { additionalProperty: key1 },
								message: "must NOT have additional properties"
							}];
							return false;
						}
						if (data0.shutting_down !== void 0) {
							if (typeof data0.shutting_down !== "boolean") {
								validate103.errors = [{
									instancePath: instancePath + "/data/shutting_down",
									schemaPath: "#/$defs/ExitResult/properties/shutting_down/type",
									keyword: "type",
									params: { type: "boolean" },
									message: "must be boolean"
								}];
								return false;
							}
						}
					}
				} else {
					validate103.errors = [{
						instancePath: instancePath + "/data",
						schemaPath: "#/$defs/ExitResult/type",
						keyword: "type",
						params: { type: "object" },
						message: "must be object"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.schema_version !== void 0) {
					let data2 = data.schema_version;
					if (typeof data2 !== "string") {
						validate103.errors = [{
							instancePath: instancePath + "/schema_version",
							schemaPath: "#/$defs/SchemaVersion/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					if (!(data2 === "0.3")) {
						validate103.errors = [{
							instancePath: instancePath + "/schema_version",
							schemaPath: "#/$defs/SchemaVersion/enum",
							keyword: "enum",
							params: { allowedValues: schema143.enum },
							message: "must be equal to one of the allowed values"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
			}
		}
	} else {
		validate103.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate103.errors = vErrors;
	return true;
}
validate103.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema145 = {
	"additionalProperties": false,
	"properties": {
		"code": { "$ref": "#/$defs/ErrorCode" },
		"field_path": { "type": ["string", "null"] },
		"may_have_been_charged": { "type": "boolean" },
		"message": { "type": "string" },
		"retryability": { "$ref": "#/$defs/Retryability" },
		"trace_id": { "type": "string" }
	},
	"required": [
		"code",
		"message",
		"retryability",
		"field_path",
		"trace_id",
		"may_have_been_charged"
	],
	"type": "object"
};
var schema146 = {
	"enum": [
		"INVALID_INPUT",
		"PERMISSION_DENIED",
		"DATA_GENERATION_CHANGED",
		"IDEMPOTENCY_CONFLICT",
		"CONFIG_CONFLICT",
		"BACKPRESSURE",
		"SHUTTING_DOWN",
		"DB_BUSY",
		"DB_CORRUPT",
		"DISK_FULL",
		"IO_ERROR",
		"SCHEMA_UNSUPPORTED",
		"DATA_ROOT_INVALID",
		"MESSAGE_NOT_FOUND",
		"SEARCH_CANCELLED",
		"SEARCH_TIMEOUT",
		"CAPABILITY_UNSUPPORTED",
		"INTERNAL_ERROR"
	],
	"type": "string"
};
var schema147 = {
	"enum": [
		"never",
		"retry",
		"after_user_action"
	],
	"type": "string"
};
function validate106(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate106.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate106.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "field_path" || key0 === "may_have_been_charged" || key0 === "message" || key0 === "retryability" || key0 === "trace_id")) {
				validate106.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.code !== void 0) {
				let data0 = data.code;
				if (typeof data0 !== "string") {
					validate106.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate106.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema146.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.field_path !== void 0) {
					let data1 = data.field_path;
					if (typeof data1 !== "string" && data1 !== null) {
						validate106.errors = [{
							instancePath: instancePath + "/field_path",
							schemaPath: "#/properties/field_path/type",
							keyword: "type",
							params: { type: schema145.properties.field_path.type },
							message: "must be string,null"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.may_have_been_charged !== void 0) {
						if (typeof data.may_have_been_charged !== "boolean") {
							validate106.errors = [{
								instancePath: instancePath + "/may_have_been_charged",
								schemaPath: "#/properties/may_have_been_charged/type",
								keyword: "type",
								params: { type: "boolean" },
								message: "must be boolean"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.message !== void 0) {
							if (typeof data.message !== "string") {
								validate106.errors = [{
									instancePath: instancePath + "/message",
									schemaPath: "#/properties/message/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.retryability !== void 0) {
								let data4 = data.retryability;
								if (typeof data4 !== "string") {
									validate106.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "never" || data4 === "retry" || data4 === "after_user_action")) {
									validate106.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/enum",
										keyword: "enum",
										params: { allowedValues: schema147.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.trace_id !== void 0) {
									if (typeof data.trace_id !== "string") {
										validate106.errors = [{
											instancePath: instancePath + "/trace_id",
											schemaPath: "#/properties/trace_id/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
							}
						}
					}
				}
			}
		}
	} else {
		validate106.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate106.errors = vErrors;
	return true;
}
validate106.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate105(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate105.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate105.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "error" || key0 === "schema_version")) {
					validate105.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.error !== void 0) {
						const _errs2 = errors;
						if (!validate106(data.error, {
							instancePath: instancePath + "/error",
							parentData: data,
							parentDataProperty: "error",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate106.errors : vErrors.concat(validate106.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate105.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate105.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema143.enum },
									message: "must be equal to one of the allowed values"
								}];
								return false;
							}
							var valid0 = _errs3 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate105.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate105.errors = vErrors;
	return errors === 0;
}
validate105.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate102(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate102.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate103(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate103.errors : vErrors.concat(validate103.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate105(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate105.errors : vErrors.concat(validate105.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs2 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) {
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err0 = {
			instancePath,
			schemaPath: "#/anyOf",
			keyword: "anyOf",
			params: {},
			message: "must match a schema in anyOf"
		};
		if (vErrors === null) vErrors = [err0];
		else vErrors.push(err0);
		errors++;
		validate102.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate102.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate102.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
export { validateAppSnapshotRequest, validateAppSnapshotResponse, validateAppearanceSaveRequest, validateAppearanceSaveResponse, validateCancelSearchRequest, validateCancelSearchResponse, validateChatListRequest, validateChatListResponse, validateChatSearchRequest, validateChatSearchResponse, validateChatSendRequest, validateChatSendResponse, validateDomainEvent, validateExitRequest, validateExitResponse };
