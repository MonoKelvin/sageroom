// generated/raw-validators/validateAvatarImportResponse.js
var validateAvatarImportResponse = validate114;
var schema155 = {
	"enum": ["0.3"],
	"type": "string"
};
function validate115(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate115.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
				validate115.errors = [{
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
					validate115.errors = [{
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
							validate115.errors = vErrors;
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
								validate115.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data6 === "0.3")) {
								validate115.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema155.enum },
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
			validate115.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate115.errors = vErrors;
	return errors === 0;
}
validate115.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema157 = {
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
var schema158 = {
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
var schema159 = {
	"enum": [
		"never",
		"retry",
		"after_user_action"
	],
	"type": "string"
};
function validate118(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate118.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate118.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "field_path" || key0 === "may_have_been_charged" || key0 === "message" || key0 === "retryability" || key0 === "trace_id")) {
				validate118.errors = [{
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
					validate118.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate118.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema158.enum },
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
						validate118.errors = [{
							instancePath: instancePath + "/field_path",
							schemaPath: "#/properties/field_path/type",
							keyword: "type",
							params: { type: schema157.properties.field_path.type },
							message: "must be string,null"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.may_have_been_charged !== void 0) {
						if (typeof data.may_have_been_charged !== "boolean") {
							validate118.errors = [{
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
								validate118.errors = [{
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
									validate118.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "never" || data4 === "retry" || data4 === "after_user_action")) {
									validate118.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/enum",
										keyword: "enum",
										params: { allowedValues: schema159.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.trace_id !== void 0) {
									if (typeof data.trace_id !== "string") {
										validate118.errors = [{
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
		validate118.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate118.errors = vErrors;
	return true;
}
validate118.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate117(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate117.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate117.errors = [{
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
					validate117.errors = [{
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
						if (!validate118(data.error, {
							instancePath: instancePath + "/error",
							parentData: data,
							parentDataProperty: "error",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate118.errors : vErrors.concat(validate118.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate117.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate117.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema155.enum },
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
			validate117.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate117.errors = vErrors;
	return errors === 0;
}
validate117.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate114(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate114.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate115(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate115.errors : vErrors.concat(validate115.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate117(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate117.errors : vErrors.concat(validate117.errors);
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
		validate114.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate114.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate114.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
export { validateAvatarImportResponse };
