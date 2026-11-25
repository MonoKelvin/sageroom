// generated/raw-validators/validateAppLifecycleEvent.js
var validateAppLifecycleEvent = validate72;
var schema100 = {
	"enum": ["0.3"],
	"type": "string"
};
var schema97 = {
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
var schema98 = { "oneOf": [{
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
var schema99 = {
	"enum": [
		"never",
		"retry",
		"after_user_action"
	],
	"type": "string"
};
function validate74(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate74.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
				validate74.errors = [{
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
					validate74.errors = [{
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
								params: { allowedValues: schema98.oneOf[0].enum },
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
							validate74.errors = vErrors;
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
								validate74.errors = [{
									instancePath: instancePath + "/field_path",
									schemaPath: "#/properties/field_path/type",
									keyword: "type",
									params: { type: schema97.properties.field_path.type },
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
									validate74.errors = [{
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
										validate74.errors = [{
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
											validate74.errors = [{
												instancePath: instancePath + "/retryability",
												schemaPath: "#/$defs/Retryability/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											}];
											return false;
										}
										if (!(data4 === "never" || data4 === "retry" || data4 === "after_user_action")) {
											validate74.errors = [{
												instancePath: instancePath + "/retryability",
												schemaPath: "#/$defs/Retryability/enum",
												keyword: "enum",
												params: { allowedValues: schema99.enum },
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
												validate74.errors = [{
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
			validate74.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate74.errors = vErrors;
	return errors === 0;
}
validate74.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate73(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate73.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	let passing0 = null;
	const _errs1 = errors;
	if (errors === _errs1) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.kind === void 0 && (missing0 = "kind") || data.request_id === void 0 && (missing0 = "request_id")) {
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
				for (const key0 in data) if (!(key0 === "kind" || key0 === "request_id")) {
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
						if ("exit_prepare" !== data0) {
							const err3 = {
								instancePath: instancePath + "/kind",
								schemaPath: "#/oneOf/0/properties/kind/const",
								keyword: "const",
								params: { allowedValue: "exit_prepare" },
								message: "must be equal to constant"
							};
							if (vErrors === null) vErrors = [err3];
							else vErrors.push(err3);
							errors++;
						}
						var valid1 = _errs4 === errors;
					} else var valid1 = true;
					if (valid1) {
						if (data.request_id !== void 0) {
							const _errs6 = errors;
							if (typeof data.request_id !== "string") {
								const err4 = {
									instancePath: instancePath + "/request_id",
									schemaPath: "#/oneOf/0/properties/request_id/type",
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
					}
				}
			}
		} else {
			const err5 = {
				instancePath,
				schemaPath: "#/oneOf/0/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			};
			if (vErrors === null) vErrors = [err5];
			else vErrors.push(err5);
			errors++;
		}
	}
	var _valid0 = _errs1 === errors;
	if (_valid0) {
		valid0 = true;
		passing0 = 0;
		var props0 = true;
	}
	const _errs8 = errors;
	if (errors === _errs8) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing1;
			if (data.kind === void 0 && (missing1 = "kind") || data.request_id === void 0 && (missing1 = "request_id") || data.error === void 0 && (missing1 = "error")) {
				const err6 = {
					instancePath,
					schemaPath: "#/oneOf/1/required",
					keyword: "required",
					params: { missingProperty: missing1 },
					message: "must have required property '" + missing1 + "'"
				};
				if (vErrors === null) vErrors = [err6];
				else vErrors.push(err6);
				errors++;
			} else {
				const _errs10 = errors;
				for (const key1 in data) if (!(key1 === "error" || key1 === "kind" || key1 === "request_id")) {
					const err7 = {
						instancePath,
						schemaPath: "#/oneOf/1/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key1 },
						message: "must NOT have additional properties"
					};
					if (vErrors === null) vErrors = [err7];
					else vErrors.push(err7);
					errors++;
					break;
				}
				if (_errs10 === errors) {
					if (data.error !== void 0) {
						const _errs11 = errors;
						if (!validate74(data.error, {
							instancePath: instancePath + "/error",
							parentData: data,
							parentDataProperty: "error",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate74.errors : vErrors.concat(validate74.errors);
							errors = vErrors.length;
						}
						var valid2 = _errs11 === errors;
					} else var valid2 = true;
					if (valid2) {
						if (data.kind !== void 0) {
							let data3 = data.kind;
							const _errs12 = errors;
							if (typeof data3 !== "string") {
								const err8 = {
									instancePath: instancePath + "/kind",
									schemaPath: "#/oneOf/1/properties/kind/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								};
								if (vErrors === null) vErrors = [err8];
								else vErrors.push(err8);
								errors++;
							}
							if ("exit_cancelled" !== data3) {
								const err9 = {
									instancePath: instancePath + "/kind",
									schemaPath: "#/oneOf/1/properties/kind/const",
									keyword: "const",
									params: { allowedValue: "exit_cancelled" },
									message: "must be equal to constant"
								};
								if (vErrors === null) vErrors = [err9];
								else vErrors.push(err9);
								errors++;
							}
							var valid2 = _errs12 === errors;
						} else var valid2 = true;
						if (valid2) {
							if (data.request_id !== void 0) {
								const _errs14 = errors;
								if (typeof data.request_id !== "string") {
									const err10 = {
										instancePath: instancePath + "/request_id",
										schemaPath: "#/oneOf/1/properties/request_id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									};
									if (vErrors === null) vErrors = [err10];
									else vErrors.push(err10);
									errors++;
								}
								var valid2 = _errs14 === errors;
							} else var valid2 = true;
						}
					}
				}
			}
		} else {
			const err11 = {
				instancePath,
				schemaPath: "#/oneOf/1/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			};
			if (vErrors === null) vErrors = [err11];
			else vErrors.push(err11);
			errors++;
		}
	}
	var _valid0 = _errs8 === errors;
	if (_valid0 && valid0) {
		valid0 = false;
		passing0 = [passing0, 1];
	} else if (_valid0) {
		valid0 = true;
		passing0 = 1;
		if (props0 !== true) props0 = true;
	}
	if (!valid0) {
		const err12 = {
			instancePath,
			schemaPath: "#/oneOf",
			keyword: "oneOf",
			params: { passingSchemas: passing0 },
			message: "must match exactly one schema in oneOf"
		};
		if (vErrors === null) vErrors = [err12];
		else vErrors.push(err12);
		errors++;
		validate73.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate73.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate73.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
function validate72(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate72.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.payload === void 0 && (missing0 = "payload")) {
				validate72.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "payload" || key0 === "schema_version")) {
					validate72.errors = [{
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
							validate72.errors = [{
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
						if (data.payload !== void 0) {
							const _errs4 = errors;
							if (!validate73(data.payload, {
								instancePath: instancePath + "/payload",
								parentData: data,
								parentDataProperty: "payload",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate73.errors : vErrors.concat(validate73.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.schema_version !== void 0) {
								let data2 = data.schema_version;
								const _errs5 = errors;
								if (typeof data2 !== "string") {
									validate72.errors = [{
										instancePath: instancePath + "/schema_version",
										schemaPath: "#/$defs/SchemaVersion/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data2 === "0.3")) {
									validate72.errors = [{
										instancePath: instancePath + "/schema_version",
										schemaPath: "#/$defs/SchemaVersion/enum",
										keyword: "enum",
										params: { allowedValues: schema100.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = _errs5 === errors;
							} else var valid0 = true;
						}
					}
				}
			}
		} else {
			validate72.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate72.errors = vErrors;
	return errors === 0;
}
validate72.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateAppLifecycleEvent };
