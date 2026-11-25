// generated/raw-validators/validateUiPreferencesSaveRequest.js
var validateUiPreferencesSaveRequest = validate508;
var schema657 = {
	"enum": ["hide", "exit"],
	"type": "string"
};
var schema658 = {
	"enum": ["enter", "ctrl_enter"],
	"type": "string"
};
function validate509(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate509.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		for (const key0 in data) if (!(key0 === "close_action" || key0 === "send_key")) {
			validate509.errors = [{
				instancePath,
				schemaPath: "#/additionalProperties",
				keyword: "additionalProperties",
				params: { additionalProperty: key0 },
				message: "must NOT have additional properties"
			}];
			return false;
		}
		if (data.close_action !== void 0) {
			let data0 = data.close_action;
			if (typeof data0 !== "string") {
				validate509.errors = [{
					instancePath: instancePath + "/close_action",
					schemaPath: "#/$defs/CloseAction/type",
					keyword: "type",
					params: { type: "string" },
					message: "must be string"
				}];
				return false;
			}
			if (!(data0 === "hide" || data0 === "exit")) {
				validate509.errors = [{
					instancePath: instancePath + "/close_action",
					schemaPath: "#/$defs/CloseAction/enum",
					keyword: "enum",
					params: { allowedValues: schema657.enum },
					message: "must be equal to one of the allowed values"
				}];
				return false;
			}
			var valid0 = true;
		} else var valid0 = true;
		if (valid0) {
			if (data.send_key !== void 0) {
				let data1 = data.send_key;
				if (typeof data1 !== "string") {
					validate509.errors = [{
						instancePath: instancePath + "/send_key",
						schemaPath: "#/$defs/SendKey/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data1 === "enter" || data1 === "ctrl_enter")) {
					validate509.errors = [{
						instancePath: instancePath + "/send_key",
						schemaPath: "#/$defs/SendKey/enum",
						keyword: "enum",
						params: { allowedValues: schema658.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
		}
	} else {
		validate509.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate509.errors = vErrors;
	return true;
}
validate509.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate508(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate508.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.preferences === void 0 && (missing0 = "preferences")) {
				validate508.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "preferences")) {
					validate508.errors = [{
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
							validate508.errors = [{
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
						if (data.preferences !== void 0) {
							const _errs4 = errors;
							if (!validate509(data.preferences, {
								instancePath: instancePath + "/preferences",
								parentData: data,
								parentDataProperty: "preferences",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate509.errors : vErrors.concat(validate509.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate508.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate508.errors = vErrors;
	return errors === 0;
}
validate508.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateUiPreferencesSaveRequest };
