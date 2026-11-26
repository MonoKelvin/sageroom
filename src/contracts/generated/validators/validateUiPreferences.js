// generated/raw-validators/validateUiPreferences.js
var validateUiPreferences = validate579;
var schema729 = {
	"enum": ["hide", "exit"],
	"type": "string"
};
var schema730 = {
	"enum": ["enter", "ctrl_enter"],
	"type": "string"
};
function validate579(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate579.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		for (const key0 in data) if (!(key0 === "close_action" || key0 === "send_key")) {
			validate579.errors = [{
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
				validate579.errors = [{
					instancePath: instancePath + "/close_action",
					schemaPath: "#/$defs/CloseAction/type",
					keyword: "type",
					params: { type: "string" },
					message: "must be string"
				}];
				return false;
			}
			if (!(data0 === "hide" || data0 === "exit")) {
				validate579.errors = [{
					instancePath: instancePath + "/close_action",
					schemaPath: "#/$defs/CloseAction/enum",
					keyword: "enum",
					params: { allowedValues: schema729.enum },
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
					validate579.errors = [{
						instancePath: instancePath + "/send_key",
						schemaPath: "#/$defs/SendKey/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				if (!(data1 === "enter" || data1 === "ctrl_enter")) {
					validate579.errors = [{
						instancePath: instancePath + "/send_key",
						schemaPath: "#/$defs/SendKey/enum",
						keyword: "enum",
						params: { allowedValues: schema730.enum },
						message: "must be equal to one of the allowed values"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
		}
	} else {
		validate579.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate579.errors = vErrors;
	return true;
}
validate579.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateUiPreferences };
