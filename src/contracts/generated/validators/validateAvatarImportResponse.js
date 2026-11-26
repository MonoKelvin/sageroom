// generated/raw-validators/validateAvatarImportResponse.js
var validateAvatarImportResponse = validate133;
var schema177 = {
	"enum": ["0.3"],
	"type": "string"
};
function validate134(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate134.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate134.errors = [{
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
					validate134.errors = [{
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
						let data0 = data.data;
						const _errs2 = errors;
						const _errs3 = errors;
						let valid1 = false;
						const _errs4 = errors;
						if (errors === errors) {
							if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
								let missing1;
								if (data0.id === void 0 && (missing1 = "id") || data0.mime_type === void 0 && (missing1 = "mime_type") || data0.width === void 0 && (missing1 = "width") || data0.height === void 0 && (missing1 = "height") || data0.byte_size === void 0 && (missing1 = "byte_size")) {
									const err0 = {
										instancePath: instancePath + "/data",
										schemaPath: "#/$defs/AvatarObject/required",
										keyword: "required",
										params: { missingProperty: missing1 },
										message: "must have required property '" + missing1 + "'"
									};
									if (vErrors === null) vErrors = [err0];
									else vErrors.push(err0);
									errors++;
								} else {
									const _errs7 = errors;
									for (const key1 in data0) if (!(key1 === "byte_size" || key1 === "height" || key1 === "id" || key1 === "mime_type" || key1 === "width")) {
										const err1 = {
											instancePath: instancePath + "/data",
											schemaPath: "#/$defs/AvatarObject/additionalProperties",
											keyword: "additionalProperties",
											params: { additionalProperty: key1 },
											message: "must NOT have additional properties"
										};
										if (vErrors === null) vErrors = [err1];
										else vErrors.push(err1);
										errors++;
										break;
									}
									if (_errs7 === errors) {
										if (data0.byte_size !== void 0) {
											let data1 = data0.byte_size;
											const _errs8 = errors;
											if (!(typeof data1 == "number" && !(data1 % 1) && !isNaN(data1) && isFinite(data1))) {
												const err2 = {
													instancePath: instancePath + "/data/byte_size",
													schemaPath: "#/$defs/AvatarObject/properties/byte_size/type",
													keyword: "type",
													params: { type: "integer" },
													message: "must be integer"
												};
												if (vErrors === null) vErrors = [err2];
												else vErrors.push(err2);
												errors++;
											}
											if (errors === _errs8) {
												if (typeof data1 == "number" && isFinite(data1)) {
													if (data1 < 0 || isNaN(data1)) {
														const err3 = {
															instancePath: instancePath + "/data/byte_size",
															schemaPath: "#/$defs/AvatarObject/properties/byte_size/minimum",
															keyword: "minimum",
															params: {
																comparison: ">=",
																limit: 0
															},
															message: "must be >= 0"
														};
														if (vErrors === null) vErrors = [err3];
														else vErrors.push(err3);
														errors++;
													}
												}
											}
											var valid3 = _errs8 === errors;
										} else var valid3 = true;
										if (valid3) {
											if (data0.height !== void 0) {
												let data2 = data0.height;
												const _errs10 = errors;
												if (!(typeof data2 == "number" && !(data2 % 1) && !isNaN(data2) && isFinite(data2))) {
													const err4 = {
														instancePath: instancePath + "/data/height",
														schemaPath: "#/$defs/AvatarObject/properties/height/type",
														keyword: "type",
														params: { type: "integer" },
														message: "must be integer"
													};
													if (vErrors === null) vErrors = [err4];
													else vErrors.push(err4);
													errors++;
												}
												if (errors === _errs10) {
													if (typeof data2 == "number" && isFinite(data2)) {
														if (data2 < 0 || isNaN(data2)) {
															const err5 = {
																instancePath: instancePath + "/data/height",
																schemaPath: "#/$defs/AvatarObject/properties/height/minimum",
																keyword: "minimum",
																params: {
																	comparison: ">=",
																	limit: 0
																},
																message: "must be >= 0"
															};
															if (vErrors === null) vErrors = [err5];
															else vErrors.push(err5);
															errors++;
														}
													}
												}
												var valid3 = _errs10 === errors;
											} else var valid3 = true;
											if (valid3) {
												if (data0.id !== void 0) {
													const _errs12 = errors;
													if (typeof data0.id !== "string") {
														const err6 = {
															instancePath: instancePath + "/data/id",
															schemaPath: "#/$defs/AvatarObject/properties/id/type",
															keyword: "type",
															params: { type: "string" },
															message: "must be string"
														};
														if (vErrors === null) vErrors = [err6];
														else vErrors.push(err6);
														errors++;
													}
													var valid3 = _errs12 === errors;
												} else var valid3 = true;
												if (valid3) {
													if (data0.mime_type !== void 0) {
														const _errs14 = errors;
														if (typeof data0.mime_type !== "string") {
															const err7 = {
																instancePath: instancePath + "/data/mime_type",
																schemaPath: "#/$defs/AvatarObject/properties/mime_type/type",
																keyword: "type",
																params: { type: "string" },
																message: "must be string"
															};
															if (vErrors === null) vErrors = [err7];
															else vErrors.push(err7);
															errors++;
														}
														var valid3 = _errs14 === errors;
													} else var valid3 = true;
													if (valid3) {
														if (data0.width !== void 0) {
															let data5 = data0.width;
															const _errs16 = errors;
															if (!(typeof data5 == "number" && !(data5 % 1) && !isNaN(data5) && isFinite(data5))) {
																const err8 = {
																	instancePath: instancePath + "/data/width",
																	schemaPath: "#/$defs/AvatarObject/properties/width/type",
																	keyword: "type",
																	params: { type: "integer" },
																	message: "must be integer"
																};
																if (vErrors === null) vErrors = [err8];
																else vErrors.push(err8);
																errors++;
															}
															if (errors === _errs16) {
																if (typeof data5 == "number" && isFinite(data5)) {
																	if (data5 < 0 || isNaN(data5)) {
																		const err9 = {
																			instancePath: instancePath + "/data/width",
																			schemaPath: "#/$defs/AvatarObject/properties/width/minimum",
																			keyword: "minimum",
																			params: {
																				comparison: ">=",
																				limit: 0
																			},
																			message: "must be >= 0"
																		};
																		if (vErrors === null) vErrors = [err9];
																		else vErrors.push(err9);
																		errors++;
																	}
																}
															}
															var valid3 = _errs16 === errors;
														} else var valid3 = true;
													}
												}
											}
										}
									}
								}
							} else {
								const err10 = {
									instancePath: instancePath + "/data",
									schemaPath: "#/$defs/AvatarObject/type",
									keyword: "type",
									params: { type: "object" },
									message: "must be object"
								};
								if (vErrors === null) vErrors = [err10];
								else vErrors.push(err10);
								errors++;
							}
						}
						var _valid0 = _errs4 === errors;
						valid1 = valid1 || _valid0;
						const _errs18 = errors;
						if (data0 !== null) {
							const err11 = {
								instancePath: instancePath + "/data",
								schemaPath: "#/properties/data/anyOf/1/type",
								keyword: "type",
								params: { type: "null" },
								message: "must be null"
							};
							if (vErrors === null) vErrors = [err11];
							else vErrors.push(err11);
							errors++;
						}
						var _valid0 = _errs18 === errors;
						valid1 = valid1 || _valid0;
						if (!valid1) {
							const err12 = {
								instancePath: instancePath + "/data",
								schemaPath: "#/properties/data/anyOf",
								keyword: "anyOf",
								params: {},
								message: "must match a schema in anyOf"
							};
							if (vErrors === null) vErrors = [err12];
							else vErrors.push(err12);
							errors++;
							validate134.errors = vErrors;
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
						if (data.schema_version !== void 0) {
							let data6 = data.schema_version;
							const _errs20 = errors;
							if (typeof data6 !== "string") {
								validate134.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data6 === "0.3")) {
								validate134.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema177.enum },
									message: "must be equal to one of the allowed values"
								}];
								return false;
							}
							var valid0 = _errs20 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate134.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate134.errors = vErrors;
	return errors === 0;
}
validate134.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema179 = {
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
var schema180 = { "oneOf": [{
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
var schema181 = {
	"enum": [
		"never",
		"retry",
		"after_user_action"
	],
	"type": "string"
};
function validate137(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate137.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
				validate137.errors = [{
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
					validate137.errors = [{
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
								params: { allowedValues: schema180.oneOf[0].enum },
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
							validate137.errors = vErrors;
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
								validate137.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema179.properties.field_path.type },
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
									validate137.errors = [{
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
										validate137.errors = [{
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
											validate137.errors = [{
												instancePath: instancePath + "/retryability",
												schemaPath: "#/$defs/Retryability/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											}];
											return false;
										}
										if (!(data4 === "never" || data4 === "retry" || data4 === "after_user_action")) {
											validate137.errors = [{
												instancePath: instancePath + "/retryability",
												schemaPath: "#/$defs/Retryability/enum",
												keyword: "enum",
												params: { allowedValues: schema181.enum },
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
												validate137.errors = [{
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
			validate137.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate137.errors = vErrors;
	return errors === 0;
}
validate137.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate136(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate136.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate136.errors = [{
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
					validate136.errors = [{
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
						if (!validate137(data.error, {
							instancePath: instancePath + "/error",
							parentData: data,
							parentDataProperty: "error",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate137.errors : vErrors.concat(validate137.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate136.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate136.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema177.enum },
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
			validate136.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate136.errors = vErrors;
	return errors === 0;
}
validate136.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate133(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate133.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate134(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate134.errors : vErrors.concat(validate134.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate136(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate136.errors : vErrors.concat(validate136.errors);
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
		validate133.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate133.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate133.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
export { validateAvatarImportResponse };
