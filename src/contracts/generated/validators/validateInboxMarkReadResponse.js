import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateInboxMarkReadResponse.js
var validateInboxMarkReadResponse = validate323;
var schema429 = {
	"enum": ["0.3"],
	"type": "string"
};
var schema424 = {
	"additionalProperties": false,
	"description": "单个会话的未读状态与最近消息摘要。当前只有群聊，后续私聊复用同一结构。",
	"properties": {
		"first_unread_id": { "type": ["string", "null"] },
		"first_unread_seq": {
			"anyOf": [{ "$ref": "#/$defs/DecimalString" }, { "type": "null" }],
			"description": "最早一条未读消息，用于跳转与“xx 条未读”提示。"
		},
		"id": { "type": "string" },
		"kind": {
			"description": "`group` 或 `direct`；列表、托盘据此区分会话形态。",
			"type": "string"
		},
		"last_read_seq": { "$ref": "#/$defs/DecimalString" },
		"latest_at": {
			"format": "int64",
			"maximum": 9007199254740991,
			"minimum": -9007199254740991,
			"type": "integer"
		},
		"latest_preview": {
			"description": "文本化摘要：文本原样，附件转 `[图片]`/`[文件]`，表情转 `[表情包]`。",
			"type": "string"
		},
		"latest_sender": {
			"description": "最近一条可见消息的发送者显示名；没有消息时为 null。",
			"type": ["string", "null"]
		},
		"latest_seq": { "$ref": "#/$defs/DecimalString" },
		"muted": { "type": "boolean" },
		"name": { "type": "string" },
		"unread_count": {
			"description": "最近一条可见消息中由他人发送、且晚于 last_read_seq 的条数。",
			"format": "uint32",
			"minimum": 0,
			"type": "integer"
		}
	},
	"required": [
		"id",
		"name",
		"kind",
		"unread_count",
		"muted",
		"last_read_seq",
		"latest_seq",
		"latest_at",
		"latest_sender",
		"latest_preview",
		"first_unread_seq",
		"first_unread_id"
	],
	"type": "object"
};
var func1 = Object.prototype.hasOwnProperty;
var func2 = require_ucs2length().default;
var pattern4 = /* @__PURE__ */ new RegExp("^(0|[1-9][0-9]*)$", "u");
function validate326(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate326.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.kind === void 0 && (missing0 = "kind") || data.unread_count === void 0 && (missing0 = "unread_count") || data.muted === void 0 && (missing0 = "muted") || data.last_read_seq === void 0 && (missing0 = "last_read_seq") || data.latest_seq === void 0 && (missing0 = "latest_seq") || data.latest_at === void 0 && (missing0 = "latest_at") || data.latest_sender === void 0 && (missing0 = "latest_sender") || data.latest_preview === void 0 && (missing0 = "latest_preview") || data.first_unread_seq === void 0 && (missing0 = "first_unread_seq") || data.first_unread_id === void 0 && (missing0 = "first_unread_id")) {
				validate326.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!func1.call(schema424.properties, key0)) {
					validate326.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.first_unread_id !== void 0) {
						let data0 = data.first_unread_id;
						const _errs2 = errors;
						if (typeof data0 !== "string" && data0 !== null) {
							validate326.errors = [{
								instancePath: instancePath + "/first_unread_id",
								schemaPath: "#/properties/first_unread_id/type",
								keyword: "type",
								params: { type: schema424.properties.first_unread_id.type },
								message: "must be string,null"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.first_unread_seq !== void 0) {
							let data1 = data.first_unread_seq;
							const _errs4 = errors;
							const _errs5 = errors;
							let valid1 = false;
							const _errs6 = errors;
							if (errors === errors) {
								if (typeof data1 === "string") {
									if (func2(data1) > 19) {
										const err0 = {
											instancePath: instancePath + "/first_unread_seq",
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
											instancePath: instancePath + "/first_unread_seq",
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
										instancePath: instancePath + "/first_unread_seq",
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
									instancePath: instancePath + "/first_unread_seq",
									schemaPath: "#/properties/first_unread_seq/anyOf/1/type",
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
									instancePath: instancePath + "/first_unread_seq",
									schemaPath: "#/properties/first_unread_seq/anyOf",
									keyword: "anyOf",
									params: {},
									message: "must match a schema in anyOf"
								};
								if (vErrors === null) vErrors = [err4];
								else vErrors.push(err4);
								errors++;
								validate326.errors = vErrors;
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
							if (data.id !== void 0) {
								const _errs11 = errors;
								if (typeof data.id !== "string") {
									validate326.errors = [{
										instancePath: instancePath + "/id",
										schemaPath: "#/properties/id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = _errs11 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.kind !== void 0) {
									const _errs13 = errors;
									if (typeof data.kind !== "string") {
										validate326.errors = [{
											instancePath: instancePath + "/kind",
											schemaPath: "#/properties/kind/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = _errs13 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.last_read_seq !== void 0) {
										let data4 = data.last_read_seq;
										const _errs15 = errors;
										if (errors === errors) {
											if (typeof data4 === "string") {
												if (func2(data4) > 19) {
													validate326.errors = [{
														instancePath: instancePath + "/last_read_seq",
														schemaPath: "#/$defs/DecimalString/maxLength",
														keyword: "maxLength",
														params: { limit: 19 },
														message: "must NOT have more than 19 characters"
													}];
													return false;
												} else if (!pattern4.test(data4)) {
													validate326.errors = [{
														instancePath: instancePath + "/last_read_seq",
														schemaPath: "#/$defs/DecimalString/pattern",
														keyword: "pattern",
														params: { pattern: "^(0|[1-9][0-9]*)$" },
														message: "must match pattern \"^(0|[1-9][0-9]*)$\""
													}];
													return false;
												}
											} else {
												validate326.errors = [{
													instancePath: instancePath + "/last_read_seq",
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
										if (data.latest_at !== void 0) {
											let data5 = data.latest_at;
											const _errs18 = errors;
											if (!(typeof data5 == "number" && !(data5 % 1) && !isNaN(data5) && isFinite(data5))) {
												validate326.errors = [{
													instancePath: instancePath + "/latest_at",
													schemaPath: "#/properties/latest_at/type",
													keyword: "type",
													params: { type: "integer" },
													message: "must be integer"
												}];
												return false;
											}
											if (errors === _errs18) {
												if (typeof data5 == "number" && isFinite(data5)) {
													if (data5 > 9007199254740991 || isNaN(data5)) {
														validate326.errors = [{
															instancePath: instancePath + "/latest_at",
															schemaPath: "#/properties/latest_at/maximum",
															keyword: "maximum",
															params: {
																comparison: "<=",
																limit: 9007199254740991
															},
															message: "must be <= 9007199254740991"
														}];
														return false;
													} else if (data5 < -9007199254740991 || isNaN(data5)) {
														validate326.errors = [{
															instancePath: instancePath + "/latest_at",
															schemaPath: "#/properties/latest_at/minimum",
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
											var valid0 = _errs18 === errors;
										} else var valid0 = true;
										if (valid0) {
											if (data.latest_preview !== void 0) {
												const _errs20 = errors;
												if (typeof data.latest_preview !== "string") {
													validate326.errors = [{
														instancePath: instancePath + "/latest_preview",
														schemaPath: "#/properties/latest_preview/type",
														keyword: "type",
														params: { type: "string" },
														message: "must be string"
													}];
													return false;
												}
												var valid0 = _errs20 === errors;
											} else var valid0 = true;
											if (valid0) {
												if (data.latest_sender !== void 0) {
													let data7 = data.latest_sender;
													const _errs22 = errors;
													if (typeof data7 !== "string" && data7 !== null) {
														validate326.errors = [{
															instancePath: instancePath + "/latest_sender",
															schemaPath: "#/properties/latest_sender/type",
															keyword: "type",
															params: { type: schema424.properties.latest_sender.type },
															message: "must be string,null"
														}];
														return false;
													}
													var valid0 = _errs22 === errors;
												} else var valid0 = true;
												if (valid0) {
													if (data.latest_seq !== void 0) {
														let data8 = data.latest_seq;
														const _errs24 = errors;
														if (errors === errors) {
															if (typeof data8 === "string") {
																if (func2(data8) > 19) {
																	validate326.errors = [{
																		instancePath: instancePath + "/latest_seq",
																		schemaPath: "#/$defs/DecimalString/maxLength",
																		keyword: "maxLength",
																		params: { limit: 19 },
																		message: "must NOT have more than 19 characters"
																	}];
																	return false;
																} else if (!pattern4.test(data8)) {
																	validate326.errors = [{
																		instancePath: instancePath + "/latest_seq",
																		schemaPath: "#/$defs/DecimalString/pattern",
																		keyword: "pattern",
																		params: { pattern: "^(0|[1-9][0-9]*)$" },
																		message: "must match pattern \"^(0|[1-9][0-9]*)$\""
																	}];
																	return false;
																}
															} else {
																validate326.errors = [{
																	instancePath: instancePath + "/latest_seq",
																	schemaPath: "#/$defs/DecimalString/type",
																	keyword: "type",
																	params: { type: "string" },
																	message: "must be string"
																}];
																return false;
															}
														}
														var valid0 = _errs24 === errors;
													} else var valid0 = true;
													if (valid0) {
														if (data.muted !== void 0) {
															const _errs27 = errors;
															if (typeof data.muted !== "boolean") {
																validate326.errors = [{
																	instancePath: instancePath + "/muted",
																	schemaPath: "#/properties/muted/type",
																	keyword: "type",
																	params: { type: "boolean" },
																	message: "must be boolean"
																}];
																return false;
															}
															var valid0 = _errs27 === errors;
														} else var valid0 = true;
														if (valid0) {
															if (data.name !== void 0) {
																const _errs29 = errors;
																if (typeof data.name !== "string") {
																	validate326.errors = [{
																		instancePath: instancePath + "/name",
																		schemaPath: "#/properties/name/type",
																		keyword: "type",
																		params: { type: "string" },
																		message: "must be string"
																	}];
																	return false;
																}
																var valid0 = _errs29 === errors;
															} else var valid0 = true;
															if (valid0) {
																if (data.unread_count !== void 0) {
																	let data11 = data.unread_count;
																	const _errs31 = errors;
																	if (!(typeof data11 == "number" && !(data11 % 1) && !isNaN(data11) && isFinite(data11))) {
																		validate326.errors = [{
																			instancePath: instancePath + "/unread_count",
																			schemaPath: "#/properties/unread_count/type",
																			keyword: "type",
																			params: { type: "integer" },
																			message: "must be integer"
																		}];
																		return false;
																	}
																	if (errors === _errs31) {
																		if (typeof data11 == "number" && isFinite(data11)) {
																			if (data11 < 0 || isNaN(data11)) {
																				validate326.errors = [{
																					instancePath: instancePath + "/unread_count",
																					schemaPath: "#/properties/unread_count/minimum",
																					keyword: "minimum",
																					params: {
																						comparison: ">=",
																						limit: 0
																					},
																					message: "must be >= 0"
																				}];
																				return false;
																			}
																		}
																	}
																	var valid0 = _errs31 === errors;
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
			}
		} else {
			validate326.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate326.errors = vErrors;
	return errors === 0;
}
validate326.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate325(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate325.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.revision === void 0 && (missing0 = "revision") || data.conversations === void 0 && (missing0 = "conversations") || data.unread_total === void 0 && (missing0 = "unread_total")) {
				validate325.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "conversations" || key0 === "revision" || key0 === "unread_total")) {
					validate325.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.conversations !== void 0) {
						let data0 = data.conversations;
						const _errs2 = errors;
						if (errors === _errs2) {
							if (Array.isArray(data0)) {
								const len0 = data0.length;
								for (let i0 = 0; i0 < len0; i0++) {
									const _errs4 = errors;
									if (!validate326(data0[i0], {
										instancePath: instancePath + "/conversations/" + i0,
										parentData: data0,
										parentDataProperty: i0,
										rootData,
										dynamicAnchors
									})) {
										vErrors = vErrors === null ? validate326.errors : vErrors.concat(validate326.errors);
										errors = vErrors.length;
									}
									if (!(_errs4 === errors)) break;
								}
							} else {
								validate325.errors = [{
									instancePath: instancePath + "/conversations",
									schemaPath: "#/properties/conversations/type",
									keyword: "type",
									params: { type: "array" },
									message: "must be array"
								}];
								return false;
							}
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.revision !== void 0) {
							let data2 = data.revision;
							const _errs5 = errors;
							if (errors === errors) {
								if (typeof data2 === "string") {
									if (func2(data2) > 19) {
										validate325.errors = [{
											instancePath: instancePath + "/revision",
											schemaPath: "#/$defs/DecimalString/maxLength",
											keyword: "maxLength",
											params: { limit: 19 },
											message: "must NOT have more than 19 characters"
										}];
										return false;
									} else if (!pattern4.test(data2)) {
										validate325.errors = [{
											instancePath: instancePath + "/revision",
											schemaPath: "#/$defs/DecimalString/pattern",
											keyword: "pattern",
											params: { pattern: "^(0|[1-9][0-9]*)$" },
											message: "must match pattern \"^(0|[1-9][0-9]*)$\""
										}];
										return false;
									}
								} else {
									validate325.errors = [{
										instancePath: instancePath + "/revision",
										schemaPath: "#/$defs/DecimalString/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
							}
							var valid0 = _errs5 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.unread_total !== void 0) {
								let data3 = data.unread_total;
								const _errs8 = errors;
								if (!(typeof data3 == "number" && !(data3 % 1) && !isNaN(data3) && isFinite(data3))) {
									validate325.errors = [{
										instancePath: instancePath + "/unread_total",
										schemaPath: "#/properties/unread_total/type",
										keyword: "type",
										params: { type: "integer" },
										message: "must be integer"
									}];
									return false;
								}
								if (errors === _errs8) {
									if (typeof data3 == "number" && isFinite(data3)) {
										if (data3 < 0 || isNaN(data3)) {
											validate325.errors = [{
												instancePath: instancePath + "/unread_total",
												schemaPath: "#/properties/unread_total/minimum",
												keyword: "minimum",
												params: {
													comparison: ">=",
													limit: 0
												},
												message: "must be >= 0"
											}];
											return false;
										}
									}
								}
								var valid0 = _errs8 === errors;
							} else var valid0 = true;
						}
					}
				}
			}
		} else {
			validate325.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate325.errors = vErrors;
	return errors === 0;
}
validate325.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate324(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate324.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate324.errors = [{
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
					validate324.errors = [{
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
						if (!validate325(data.data, {
							instancePath: instancePath + "/data",
							parentData: data,
							parentDataProperty: "data",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate325.errors : vErrors.concat(validate325.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate324.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate324.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema429.enum },
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
			validate324.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate324.errors = vErrors;
	return errors === 0;
}
validate324.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema431 = {
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
var schema432 = { "oneOf": [{
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
}, {
	"const": "MODEL_OUTPUT_INVALID",
	"description": "模型本轮输出不符合决策协议。属于可恢复的单轮失败，不应停用智能体。",
	"type": "string"
}] };
var schema433 = {
	"enum": [
		"never",
		"retry",
		"after_user_action"
	],
	"type": "string"
};
function validate331(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate331.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
				validate331.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "code" || key0 === "field_path" || key0 === "may_have_been_charged" || key0 === "message" || key0 === "retryability" || key0 === "trace_id")) {
					validate331.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.code !== void 0) {
						let data0 = data.code;
						const _errs2 = errors;
						const _errs4 = errors;
						let valid2 = false;
						let passing0 = null;
						const _errs5 = errors;
						if (typeof data0 !== "string") {
							const err0 = {
								instancePath: instancePath + "/code",
								schemaPath: "#/$defs/ErrorCode/oneOf/0/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							};
							if (vErrors === null) vErrors = [err0];
							else vErrors.push(err0);
							errors++;
						}
						if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
							const err1 = {
								instancePath: instancePath + "/code",
								schemaPath: "#/$defs/ErrorCode/oneOf/0/enum",
								keyword: "enum",
								params: { allowedValues: schema432.oneOf[0].enum },
								message: "must be equal to one of the allowed values"
							};
							if (vErrors === null) vErrors = [err1];
							else vErrors.push(err1);
							errors++;
						}
						var _valid0 = _errs5 === errors;
						if (_valid0) {
							valid2 = true;
							passing0 = 0;
						}
						const _errs7 = errors;
						if (typeof data0 !== "string") {
							const err2 = {
								instancePath: instancePath + "/code",
								schemaPath: "#/$defs/ErrorCode/oneOf/1/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							};
							if (vErrors === null) vErrors = [err2];
							else vErrors.push(err2);
							errors++;
						}
						if ("MODEL_OUTPUT_INVALID" !== data0) {
							const err3 = {
								instancePath: instancePath + "/code",
								schemaPath: "#/$defs/ErrorCode/oneOf/1/const",
								keyword: "const",
								params: { allowedValue: "MODEL_OUTPUT_INVALID" },
								message: "must be equal to constant"
							};
							if (vErrors === null) vErrors = [err3];
							else vErrors.push(err3);
							errors++;
						}
						var _valid0 = _errs7 === errors;
						if (_valid0 && valid2) {
							valid2 = false;
							passing0 = [passing0, 1];
						} else if (_valid0) {
							valid2 = true;
							passing0 = 1;
						}
						if (!valid2) {
							const err4 = {
								instancePath: instancePath + "/code",
								schemaPath: "#/$defs/ErrorCode/oneOf",
								keyword: "oneOf",
								params: { passingSchemas: passing0 },
								message: "must match exactly one schema in oneOf"
							};
							if (vErrors === null) vErrors = [err4];
							else vErrors.push(err4);
							errors++;
							validate331.errors = vErrors;
							return false;
						} else {
							errors = _errs4;
							if (vErrors !== null) {
								if (_errs4) vErrors.length = _errs4;
								else vErrors = null;
							}
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.field_path !== void 0) {
							let data1 = data.field_path;
							const _errs9 = errors;
							if (typeof data1 !== "string" && data1 !== null) {
								validate331.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema431.properties.field_path.type },
									message: "must be string,null"
								}];
								return false;
							}
							var valid0 = _errs9 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.may_have_been_charged !== void 0) {
								const _errs11 = errors;
								if (typeof data.may_have_been_charged !== "boolean") {
									validate331.errors = [{
										instancePath: instancePath + "/may_have_been_charged",
										schemaPath: "#/properties/may_have_been_charged/type",
										keyword: "type",
										params: { type: "boolean" },
										message: "must be boolean"
									}];
									return false;
								}
								var valid0 = _errs11 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.message !== void 0) {
									const _errs13 = errors;
									if (typeof data.message !== "string") {
										validate331.errors = [{
											instancePath: instancePath + "/message",
											schemaPath: "#/properties/message/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = _errs13 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.retryability !== void 0) {
										let data4 = data.retryability;
										const _errs15 = errors;
										if (typeof data4 !== "string") {
											validate331.errors = [{
												instancePath: instancePath + "/retryability",
												schemaPath: "#/$defs/Retryability/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											}];
											return false;
										}
										if (!(data4 === "never" || data4 === "retry" || data4 === "after_user_action")) {
											validate331.errors = [{
												instancePath: instancePath + "/retryability",
												schemaPath: "#/$defs/Retryability/enum",
												keyword: "enum",
												params: { allowedValues: schema433.enum },
												message: "must be equal to one of the allowed values"
											}];
											return false;
										}
										var valid0 = _errs15 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.trace_id !== void 0) {
											const _errs18 = errors;
											if (typeof data.trace_id !== "string") {
												validate331.errors = [{
													instancePath: instancePath + "/trace_id",
													schemaPath: "#/properties/trace_id/type",
													keyword: "type",
													params: { type: "string" },
													message: "must be string"
												}];
												return false;
											}
											var valid0 = _errs18 === errors;
										} else var valid0 = true;
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate331.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate331.errors = vErrors;
	return errors === 0;
}
validate331.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate330(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate330.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate330.errors = [{
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
					validate330.errors = [{
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
						if (!validate331(data.error, {
							instancePath: instancePath + "/error",
							parentData: data,
							parentDataProperty: "error",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate331.errors : vErrors.concat(validate331.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate330.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate330.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema429.enum },
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
			validate330.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate330.errors = vErrors;
	return errors === 0;
}
validate330.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate323(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate323.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate324(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate324.errors : vErrors.concat(validate324.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate330(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate330.errors : vErrors.concat(validate330.errors);
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
		validate323.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate323.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate323.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
export { validateInboxMarkReadResponse };
