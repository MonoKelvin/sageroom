// generated/raw-validators/validateDataDirectoryPickResponse.js
var validateDataDirectoryPickResponse = validate204;
var schema267 = {
	"additionalProperties": false,
	"properties": {
		"data": { "type": ["string", "null"] },
		"schema_version": { "$ref": "#/$defs/SchemaVersion" }
	},
	"required": ["schema_version", "data"],
	"type": "object"
};
var schema268 = {
	"enum": ["0.3"],
	"type": "string"
};
function validate205(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate205.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
			validate205.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data" || key0 === "schema_version")) {
				validate205.errors = [{
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
				if (typeof data0 !== "string" && data0 !== null) {
					validate205.errors = [{
						instancePath: instancePath + "/data",
						schemaPath: "#/properties/data/type",
						keyword: "type",
						params: { type: schema267.properties.data.type },
						message: "must be string,null"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.schema_version !== void 0) {
					let data1 = data.schema_version;
					if (typeof data1 !== "string") {
						validate205.errors = [{
							instancePath: instancePath + "/schema_version",
							schemaPath: "#/$defs/SchemaVersion/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					if (!(data1 === "0.3")) {
						validate205.errors = [{
							instancePath: instancePath + "/schema_version",
							schemaPath: "#/$defs/SchemaVersion/enum",
							keyword: "enum",
							params: { allowedValues: schema268.enum },
							message: "must be equal to one of the allowed values"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
			}
		}
	} else {
		validate205.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate205.errors = vErrors;
	return true;
}
validate205.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema270 = {
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
var schema271 = { "oneOf": [{
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
var schema272 = {
	"enum": [
		"never",
		"retry",
		"after_user_action"
	],
	"type": "string"
};
function validate208(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate208.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
				validate208.errors = [{
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
					validate208.errors = [{
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
								params: { allowedValues: schema271.oneOf[0].enum },
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
							validate208.errors = vErrors;
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
								validate208.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema270.properties.field_path.type },
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
									validate208.errors = [{
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
										validate208.errors = [{
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
											validate208.errors = [{
												instancePath: instancePath + "/retryability",
												schemaPath: "#/$defs/Retryability/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											}];
											return false;
										}
										if (!(data4 === "never" || data4 === "retry" || data4 === "after_user_action")) {
											validate208.errors = [{
												instancePath: instancePath + "/retryability",
												schemaPath: "#/$defs/Retryability/enum",
												keyword: "enum",
												params: { allowedValues: schema272.enum },
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
												validate208.errors = [{
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
			validate208.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate208.errors = vErrors;
	return errors === 0;
}
validate208.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate207(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate207.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate207.errors = [{
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
					validate207.errors = [{
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
						if (!validate208(data.error, {
							instancePath: instancePath + "/error",
							parentData: data,
							parentDataProperty: "error",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate208.errors : vErrors.concat(validate208.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate207.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate207.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema268.enum },
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
			validate207.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate207.errors = vErrors;
	return errors === 0;
}
validate207.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate204(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate204.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate205(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate205.errors : vErrors.concat(validate205.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate207(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate207.errors : vErrors.concat(validate207.errors);
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
		validate204.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate204.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate204.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
export { validateDataDirectoryPickResponse };
