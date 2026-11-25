import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateSecretStatusRequest.js
var validateSecretStatusRequest = validate444;
var func2 = require_ucs2length().default;
var pattern4 = /* @__PURE__ */ new RegExp("^(0|[1-9][0-9]*)$", "u");
function validate444(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate444.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.profile_id === void 0 && (missing0 = "profile_id") || data.expected_revision === void 0 && (missing0 = "expected_revision")) {
			validate444.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "expected_revision" || key0 === "profile_id")) {
				validate444.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.data_generation_id !== void 0) {
				if (typeof data.data_generation_id !== "string") {
					validate444.errors = [{
						instancePath: instancePath + "/data_generation_id",
						schemaPath: "#/properties/data_generation_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.expected_revision !== void 0) {
					let data1 = data.expected_revision;
					if (typeof data1 === "string") {
						if (func2(data1) > 19) {
							validate444.errors = [{
								instancePath: instancePath + "/expected_revision",
								schemaPath: "#/$defs/DecimalString/maxLength",
								keyword: "maxLength",
								params: { limit: 19 },
								message: "must NOT have more than 19 characters"
							}];
							return false;
						} else if (!pattern4.test(data1)) {
							validate444.errors = [{
								instancePath: instancePath + "/expected_revision",
								schemaPath: "#/$defs/DecimalString/pattern",
								keyword: "pattern",
								params: { pattern: "^(0|[1-9][0-9]*)$" },
								message: "must match pattern \"^(0|[1-9][0-9]*)$\""
							}];
							return false;
						}
					} else {
						validate444.errors = [{
							instancePath: instancePath + "/expected_revision",
							schemaPath: "#/$defs/DecimalString/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.profile_id !== void 0) {
						if (typeof data.profile_id !== "string") {
							validate444.errors = [{
								instancePath: instancePath + "/profile_id",
								schemaPath: "#/properties/profile_id/type",
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
	} else {
		validate444.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate444.errors = vErrors;
	return true;
}
validate444.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateSecretStatusRequest };
