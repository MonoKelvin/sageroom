// generated/raw-validators/validateExitResponse.js
var validateExitResponse = validate253;
var schema334 = {
	"enum": ["0.3"],
	"type": "string"
};
function validate254(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate254.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
			validate254.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data" || key0 === "schema_version")) {
				validate254.errors = [{
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
						validate254.errors = [{
							instancePath: instancePath + "/data",
							schemaPath: "#/$defs/ExitResult/required",
							keyword: "required",
							params: { missingProperty: missing1 },
							message: "must have required property '" + missing1 + "'"
						}];
						return false;
					} else {
						for (const key1 in data0) if (!(key1 === "shutting_down")) {
							validate254.errors = [{
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
								validate254.errors = [{
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
					validate254.errors = [{
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
						validate254.errors = [{
							instancePath: instancePath + "/schema_version",
							schemaPath: "#/$defs/SchemaVersion/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					if (!(data2 === "0.3")) {
						validate254.errors = [{
							instancePath: instancePath + "/schema_version",
							schemaPath: "#/$defs/SchemaVersion/enum",
							keyword: "enum",
							params: { allowedValues: schema334.enum },
							message: "must be equal to one of the allowed values"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
			}
		}
	} else {
		validate254.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate254.errors = vErrors;
	return true;
}
validate254.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema336 = {
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
var schema337 = { "oneOf": [{
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
var schema338 = {
	"enum": [
		"never",
		"retry",
		"after_user_action"
	],
	"type": "string"
};
function validate257(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate257.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
				validate257.errors = [{
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
					validate257.errors = [{
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
								params: { allowedValues: schema337.oneOf[0].enum },
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
							validate257.errors = vErrors;
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
								validate257.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema336.properties.field_path.type },
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
									validate257.errors = [{
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
										validate257.errors = [{
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
											validate257.errors = [{
												instancePath: instancePath + "/retryability",
												schemaPath: "#/$defs/Retryability/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											}];
											return false;
										}
										if (!(data4 === "never" || data4 === "retry" || data4 === "after_user_action")) {
											validate257.errors = [{
												instancePath: instancePath + "/retryability",
												schemaPath: "#/$defs/Retryability/enum",
												keyword: "enum",
												params: { allowedValues: schema338.enum },
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
												validate257.errors = [{
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
			validate257.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate257.errors = vErrors;
	return errors === 0;
}
validate257.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate256(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate256.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate256.errors = [{
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
					validate256.errors = [{
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
						if (!validate257(data.error, {
							instancePath: instancePath + "/error",
							parentData: data,
							parentDataProperty: "error",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate257.errors : vErrors.concat(validate257.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate256.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate256.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema334.enum },
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
			validate256.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate256.errors = vErrors;
	return errors === 0;
}
validate256.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate253(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate253.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate254(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate254.errors : vErrors.concat(validate254.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate256(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate256.errors : vErrors.concat(validate256.errors);
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
		validate253.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate253.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate253.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
export { validateExitResponse };
