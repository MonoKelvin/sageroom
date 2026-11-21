import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateChatSearchResponse.js
var validateChatSearchResponse = validate152;
var schema211 = {
	"enum": ["0.3"],
	"type": "string"
};
var schema207 = {
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
var schema210 = {
	"enum": ["literal_unicode_substring"],
	"type": "string"
};
var func2 = require_ucs2length().default;
var pattern4 = /* @__PURE__ */ new RegExp("^(0|[1-9][0-9]*)$", "u");
function validate155(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate155.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.message_id === void 0 && (missing0 = "message_id") || data.seq === void 0 && (missing0 = "seq") || data.sender_id === void 0 && (missing0 = "sender_id") || data.snippet === void 0 && (missing0 = "snippet") || data.created_at === void 0 && (missing0 = "created_at")) {
			validate155.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "created_at" || key0 === "message_id" || key0 === "sender_id" || key0 === "seq" || key0 === "snippet")) {
				validate155.errors = [{
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
					validate155.errors = [{
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
						validate155.errors = [{
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
						validate155.errors = [{
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
						validate155.errors = [{
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
					if (data.sender_id !== void 0) {
						if (typeof data.sender_id !== "string") {
							validate155.errors = [{
								instancePath: instancePath + "/sender_id",
								schemaPath: "#/properties/sender_id/type",
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
								if (func2(data3) > 19) {
									validate155.errors = [{
										instancePath: instancePath + "/seq",
										schemaPath: "#/$defs/DecimalString/maxLength",
										keyword: "maxLength",
										params: { limit: 19 },
										message: "must NOT have more than 19 characters"
									}];
									return false;
								} else if (!pattern4.test(data3)) {
									validate155.errors = [{
										instancePath: instancePath + "/seq",
										schemaPath: "#/$defs/DecimalString/pattern",
										keyword: "pattern",
										params: { pattern: "^(0|[1-9][0-9]*)$" },
										message: "must match pattern \"^(0|[1-9][0-9]*)$\""
									}];
									return false;
								}
							} else {
								validate155.errors = [{
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
									validate155.errors = [{
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
		validate155.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate155.errors = vErrors;
	return true;
}
validate155.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate154(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate154.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.search_id === void 0 && (missing0 = "search_id") || data.query === void 0 && (missing0 = "query") || data.semantics === void 0 && (missing0 = "semantics") || data.items === void 0 && (missing0 = "items") || data.has_more === void 0 && (missing0 = "has_more") || data.next_cursor === void 0 && (missing0 = "next_cursor")) {
				validate154.errors = [{
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
					validate154.errors = [{
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
							validate154.errors = [{
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
								validate154.errors = [{
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
											if (!validate155(data2[i0], {
												instancePath: instancePath + "/items/" + i0,
												parentData: data2,
												parentDataProperty: i0,
												rootData,
												dynamicAnchors
											})) {
												vErrors = vErrors === null ? validate155.errors : vErrors.concat(validate155.errors);
												errors = vErrors.length;
											}
											if (!(_errs8 === errors)) break;
										}
									} else {
										validate154.errors = [{
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
										validate154.errors = [{
											instancePath: instancePath + "/next_cursor",
											schemaPath: "#/properties/next_cursor/type",
											keyword: "type",
											params: { type: schema207.properties.next_cursor.type },
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
											validate154.errors = [{
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
												validate154.errors = [{
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
													validate154.errors = [{
														instancePath: instancePath + "/semantics",
														schemaPath: "#/$defs/SearchSemantics/type",
														keyword: "type",
														params: { type: "string" },
														message: "must be string"
													}];
													return false;
												}
												if (!(data7 === "literal_unicode_substring")) {
													validate154.errors = [{
														instancePath: instancePath + "/semantics",
														schemaPath: "#/$defs/SearchSemantics/enum",
														keyword: "enum",
														params: { allowedValues: schema210.enum },
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
			validate154.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate154.errors = vErrors;
	return errors === 0;
}
validate154.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate153(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate153.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate153.errors = [{
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
					validate153.errors = [{
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
						if (!validate154(data.data, {
							instancePath: instancePath + "/data",
							parentData: data,
							parentDataProperty: "data",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate154.errors : vErrors.concat(validate154.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate153.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate153.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema211.enum },
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
			validate153.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate153.errors = vErrors;
	return errors === 0;
}
validate153.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema213 = {
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
var schema214 = {
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
var schema215 = {
	"enum": [
		"never",
		"retry",
		"after_user_action"
	],
	"type": "string"
};
function validate160(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate160.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate160.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "field_path" || key0 === "may_have_been_charged" || key0 === "message" || key0 === "retryability" || key0 === "trace_id")) {
				validate160.errors = [{
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
					validate160.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate160.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema214.enum },
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
						validate160.errors = [{
							instancePath: instancePath + "/field_path",
							schemaPath: "#/properties/field_path/type",
							keyword: "type",
							params: { type: schema213.properties.field_path.type },
							message: "must be string,null"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.may_have_been_charged !== void 0) {
						if (typeof data.may_have_been_charged !== "boolean") {
							validate160.errors = [{
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
								validate160.errors = [{
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
									validate160.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "never" || data4 === "retry" || data4 === "after_user_action")) {
									validate160.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/enum",
										keyword: "enum",
										params: { allowedValues: schema215.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.trace_id !== void 0) {
									if (typeof data.trace_id !== "string") {
										validate160.errors = [{
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
		validate160.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate160.errors = vErrors;
	return true;
}
validate160.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate159(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate159.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate159.errors = [{
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
					validate159.errors = [{
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
						if (!validate160(data.error, {
							instancePath: instancePath + "/error",
							parentData: data,
							parentDataProperty: "error",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate160.errors : vErrors.concat(validate160.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate159.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate159.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema211.enum },
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
			validate159.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate159.errors = vErrors;
	return errors === 0;
}
validate159.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate152(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate152.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate153(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate153.errors : vErrors.concat(validate153.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate159(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate159.errors : vErrors.concat(validate159.errors);
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
		validate152.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate152.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate152.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
export { validateChatSearchResponse };
