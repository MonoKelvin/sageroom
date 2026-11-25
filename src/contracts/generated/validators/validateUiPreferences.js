// generated/raw-validators/validateUiPreferences.js
var validateUiPreferences = validate497;
var schema641 = {
	"enum": ["hide", "exit"],
	"type": "string"
};
var schema642 = {
	"enum": ["enter", "ctrl_enter"],
	"type": "string"
};
function validate497(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate497.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		for (const key0 in data) if (!(key0 === "close_action" || key0 === "send_key")) {
			validate497.errors = [{
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
				validate497.errors = [{
					instancePath: instancePath + "/close_action",
					schemaPath: "#/$defs/CloseAction/type",
					keyword: "type",
					params: { type: "string" },
					message: "must be string"
				}];
				return false;
			}
			if (!(data0 === "hide" || data0 === "exit")) {
				validate497.errors = [{
					instancePath: instancePath + "/close_action",
					schemaPath: "#/$defs/CloseAction/enum",
					keyword: "enum",
					params: { allowedValues: schema641.enum },
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
					validate497.errors = [{
						instancePath: instancePath + "/send_key",
						schemaPath: "#/$defs/SendKey/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data1 === "enter" || data1 === "ctrl_enter")) {
					validate497.errors = [{
						instancePath: instancePath + "/send_key",
						schemaPath: "#/$defs/SendKey/enum",
						keyword: "enum",
						params: { allowedValues: schema642.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
		}
	} else {
		validate497.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate497.errors = vErrors;
	return true;
}
validate497.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateUiPreferences };
