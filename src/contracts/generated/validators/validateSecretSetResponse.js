// generated/raw-validators/validateSecretSetResponse.js
var validateSecretSetResponse = validate299;
var schema398 = {
	"enum": ["0.3"],
	"type": "string"
};
function validate300(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate300.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data === void 0 && (missing0 = "data")) {
			validate300.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data" || key0 === "schema_version")) {
				validate300.errors = [{
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
					if (data0.profile_id === void 0 && (missing1 = "profile_id") || data0.configured === void 0 && (missing1 = "configured")) {
						validate300.errors = [{
							instancePath: instancePath + "/data",
							schemaPath: "#/$defs/SecretStatus/required",
							keyword: "required",
							params: { missingProperty: missing1 },
							message: "must have required property '" + missing1 + "'"
						}];
						return false;
					} else {
						for (const key1 in data0) if (!(key1 === "configured" || key1 === "profile_id")) {
							validate300.errors = [{
								instancePath: instancePath + "/data",
								schemaPath: "#/$defs/SecretStatus/additionalProperties",
								keyword: "additionalProperties",
								params: { additionalProperty: key1 },
								message: "must NOT have additional properties"
							}];
							return false;
						}
						if (data0.configured !== void 0) {
							if (typeof data0.configured !== "boolean") {
								validate300.errors = [{
									instancePath: instancePath + "/data/configured",
									schemaPath: "#/$defs/SecretStatus/properties/configured/type",
									keyword: "type",
									params: { type: "boolean" },
									message: "must be boolean"
								}];
								return false;
							}
							var valid2 = true;
						} else var valid2 = true;
						if (valid2) {
							if (data0.profile_id !== void 0) {
								if (typeof data0.profile_id !== "string") {
									validate300.errors = [{
										instancePath: instancePath + "/data/profile_id",
										schemaPath: "#/$defs/SecretStatus/properties/profile_id/type",
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
					validate300.errors = [{
						instancePath: instancePath + "/data",
						schemaPath: "#/$defs/SecretStatus/type",
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
						validate300.errors = [{
							instancePath: instancePath + "/schema_version",
							schemaPath: "#/$defs/SchemaVersion/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					if (!(data3 === "0.3")) {
						validate300.errors = [{
							instancePath: instancePath + "/schema_version",
							schemaPath: "#/$defs/SchemaVersion/enum",
							keyword: "enum",
							params: { allowedValues: schema398.enum },
							message: "must be equal to one of the allowed values"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
			}
		}
	} else {
		validate300.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate300.errors = vErrors;
	return true;
}
validate300.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema400 = {
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
var schema401 = {
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
var schema402 = {
	"enum": [
		"never",
		"retry",
		"after_user_action"
	],
	"type": "string"
};
function validate303(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate303.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.code === void 0 && (missing0 = "code") || data.message === void 0 && (missing0 = "message") || data.retryability === void 0 && (missing0 = "retryability") || data.field_path === void 0 && (missing0 = "field_path") || data.trace_id === void 0 && (missing0 = "trace_id") || data.may_have_been_charged === void 0 && (missing0 = "may_have_been_charged")) {
			validate303.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "code" || key0 === "field_path" || key0 === "may_have_been_charged" || key0 === "message" || key0 === "retryability" || key0 === "trace_id")) {
				validate303.errors = [{
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
					validate303.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data0 === "INVALID_INPUT" || data0 === "PERMISSION_DENIED" || data0 === "DATA_GENERATION_CHANGED" || data0 === "IDEMPOTENCY_CONFLICT" || data0 === "CONFIG_CONFLICT" || data0 === "BACKPRESSURE" || data0 === "SHUTTING_DOWN" || data0 === "DB_BUSY" || data0 === "DB_CORRUPT" || data0 === "DISK_FULL" || data0 === "IO_ERROR" || data0 === "SCHEMA_UNSUPPORTED" || data0 === "DATA_ROOT_INVALID" || data0 === "MESSAGE_NOT_FOUND" || data0 === "SEARCH_CANCELLED" || data0 === "SEARCH_TIMEOUT" || data0 === "CAPABILITY_UNSUPPORTED" || data0 === "INTERNAL_ERROR")) {
					validate303.errors = [{
						instancePath: instancePath + "/code",
						schemaPath: "#/$defs/ErrorCode/enum",
						keyword: "enum",
						params: { allowedValues: schema401.enum },
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
						validate303.errors = [{
							instancePath: instancePath + "/field_path",
							schemaPath: "#/properties/field_path/type",
							keyword: "type",
							params: { type: schema400.properties.field_path.type },
							message: "must be string,null"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.may_have_been_charged !== void 0) {
						if (typeof data.may_have_been_charged !== "boolean") {
							validate303.errors = [{
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
								validate303.errors = [{
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
									validate303.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "never" || data4 === "retry" || data4 === "after_user_action")) {
									validate303.errors = [{
										instancePath: instancePath + "/retryability",
										schemaPath: "#/$defs/Retryability/enum",
										keyword: "enum",
										params: { allowedValues: schema402.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.trace_id !== void 0) {
									if (typeof data.trace_id !== "string") {
										validate303.errors = [{
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
		validate303.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate303.errors = vErrors;
	return true;
}
validate303.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate302(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate302.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.error === void 0 && (missing0 = "error")) {
				validate302.errors = [{
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
					validate302.errors = [{
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
						if (!validate303(data.error, {
							instancePath: instancePath + "/error",
							parentData: data,
							parentDataProperty: "error",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate303.errors : vErrors.concat(validate303.errors);
							errors = vErrors.length;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.schema_version !== void 0) {
							let data1 = data.schema_version;
							const _errs3 = errors;
							if (typeof data1 !== "string") {
								validate302.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							if (!(data1 === "0.3")) {
								validate302.errors = [{
									instancePath: instancePath + "/schema_version",
									schemaPath: "#/$defs/SchemaVersion/enum",
									keyword: "enum",
									params: { allowedValues: schema398.enum },
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
			validate302.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate302.errors = vErrors;
	return errors === 0;
}
validate302.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate299(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate299.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	const _errs1 = errors;
	if (!validate300(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate300.errors : vErrors.concat(validate300.errors);
		errors = vErrors.length;
	}
	var _valid0 = _errs1 === errors;
	valid0 = valid0 || _valid0;
	if (_valid0) var props0 = true;
	const _errs2 = errors;
	if (!validate302(data, {
		instancePath,
		parentData,
		parentDataProperty,
		rootData,
		dynamicAnchors
	})) {
		vErrors = vErrors === null ? validate302.errors : vErrors.concat(validate302.errors);
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
		validate299.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate299.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate299.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
export { validateSecretSetResponse };
