// generated/raw-validators/validateUiPreferencesSaveRequest.js
var validateUiPreferencesSaveRequest = validate524;
var schema677 = {
	"enum": ["hide", "exit"],
	"type": "string"
};
var schema678 = {
	"enum": ["enter", "ctrl_enter"],
	"type": "string"
};
function validate525(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate525.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		for (const key0 in data) if (!(key0 === "close_action" || key0 === "send_key")) {
			validate525.errors = [{
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
				validate525.errors = [{
					instancePath: instancePath + "/close_action",
					schemaPath: "#/$defs/CloseAction/type",
					keyword: "type",
					params: { type: "string" },
					message: "must be string"
				}];
				return false;
			}
			if (!(data0 === "hide" || data0 === "exit")) {
				validate525.errors = [{
					instancePath: instancePath + "/close_action",
					schemaPath: "#/$defs/CloseAction/enum",
					keyword: "enum",
					params: { allowedValues: schema677.enum },
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
					validate525.errors = [{
						instancePath: instancePath + "/send_key",
						schemaPath: "#/$defs/SendKey/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data1 === "enter" || data1 === "ctrl_enter")) {
					validate525.errors = [{
						instancePath: instancePath + "/send_key",
						schemaPath: "#/$defs/SendKey/enum",
						keyword: "enum",
						params: { allowedValues: schema678.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
		}
	} else {
		validate525.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate525.errors = vErrors;
	return true;
}
validate525.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate524(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate524.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.preferences === void 0 && (missing0 = "preferences")) {
				validate524.errors = [{
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
					validate524.errors = [{
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
							validate524.errors = [{
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
							if (!validate525(data.preferences, {
								instancePath: instancePath + "/preferences",
								parentData: data,
								parentDataProperty: "preferences",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate525.errors : vErrors.concat(validate525.errors);
								errors = vErrors.length;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
					}
				}
			}
		} else {
			validate524.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate524.errors = vErrors;
	return errors === 0;
}
validate524.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateUiPreferencesSaveRequest };
