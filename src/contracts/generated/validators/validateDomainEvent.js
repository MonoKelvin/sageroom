import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateDomainEvent.js
var validateDomainEvent = validate232;
var schema319 = {
	"enum": ["0.3"],
	"type": "string"
};
var func2 = require_ucs2length().default;
var pattern4 = /* @__PURE__ */ new RegExp("^(0|[1-9][0-9]*)$", "u");
function validate234(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate234.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.id === void 0 && (missing0 = "id") || data.name === void 0 && (missing0 = "name") || data.owner_participant_id === void 0 && (missing0 = "owner_participant_id") || data.version === void 0 && (missing0 = "version") || data.content_epoch === void 0 && (missing0 = "content_epoch")) {
			validate234.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "content_epoch" || key0 === "id" || key0 === "name" || key0 === "owner_participant_id" || key0 === "version")) {
				validate234.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.content_epoch !== void 0) {
				let data0 = data.content_epoch;
				if (typeof data0 === "string") {
					if (func2(data0) > 19) {
						validate234.errors = [{
							instancePath: instancePath + "/content_epoch",
							schemaPath: "#/$defs/DecimalString/maxLength",
							keyword: "maxLength",
							params: { limit: 19 },
							message: "must NOT have more than 19 characters"
						}];
						return false;
					} else if (!pattern4.test(data0)) {
						validate234.errors = [{
							instancePath: instancePath + "/content_epoch",
							schemaPath: "#/$defs/DecimalString/pattern",
							keyword: "pattern",
							params: { pattern: "^(0|[1-9][0-9]*)$" },
							message: "must match pattern \"^(0|[1-9][0-9]*)$\""
						}];
						return false;
					}
				} else {
					validate234.errors = [{
						instancePath: instancePath + "/content_epoch",
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
				if (data.id !== void 0) {
					if (typeof data.id !== "string") {
						validate234.errors = [{
							instancePath: instancePath + "/id",
							schemaPath: "#/properties/id/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.name !== void 0) {
						if (typeof data.name !== "string") {
							validate234.errors = [{
								instancePath: instancePath + "/name",
								schemaPath: "#/properties/name/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.owner_participant_id !== void 0) {
							if (typeof data.owner_participant_id !== "string") {
								validate234.errors = [{
									instancePath: instancePath + "/owner_participant_id",
									schemaPath: "#/properties/owner_participant_id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.version !== void 0) {
								let data4 = data.version;
								if (typeof data4 === "string") {
									if (func2(data4) > 19) {
										validate234.errors = [{
											instancePath: instancePath + "/version",
											schemaPath: "#/$defs/DecimalString/maxLength",
											keyword: "maxLength",
											params: { limit: 19 },
											message: "must NOT have more than 19 characters"
										}];
										return false;
									} else if (!pattern4.test(data4)) {
										validate234.errors = [{
											instancePath: instancePath + "/version",
											schemaPath: "#/$defs/DecimalString/pattern",
											keyword: "pattern",
											params: { pattern: "^(0|[1-9][0-9]*)$" },
											message: "must match pattern \"^(0|[1-9][0-9]*)$\""
										}];
										return false;
									}
								} else {
									validate234.errors = [{
										instancePath: instancePath + "/version",
										schemaPath: "#/$defs/DecimalString/type",
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
	} else {
		validate234.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate234.errors = vErrors;
	return true;
}
validate234.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema309 = {
	"enum": [
		"system",
		"light",
		"dark"
	],
	"type": "string"
};
function validate236(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate236.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.theme === void 0 && (missing0 = "theme") || data.reduce_motion === void 0 && (missing0 = "reduce_motion") || data.revision === void 0 && (missing0 = "revision")) {
			validate236.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "reduce_motion" || key0 === "revision" || key0 === "theme")) {
				validate236.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.reduce_motion !== void 0) {
				if (typeof data.reduce_motion !== "boolean") {
					validate236.errors = [{
						instancePath: instancePath + "/reduce_motion",
						schemaPath: "#/properties/reduce_motion/type",
						keyword: "type",
						params: { type: "boolean" },
						message: "must be boolean"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.revision !== void 0) {
					let data1 = data.revision;
					if (typeof data1 === "string") {
						if (func2(data1) > 19) {
							validate236.errors = [{
								instancePath: instancePath + "/revision",
								schemaPath: "#/$defs/DecimalString/maxLength",
								keyword: "maxLength",
								params: { limit: 19 },
								message: "must NOT have more than 19 characters"
							}];
							return false;
						} else if (!pattern4.test(data1)) {
							validate236.errors = [{
								instancePath: instancePath + "/revision",
								schemaPath: "#/$defs/DecimalString/pattern",
								keyword: "pattern",
								params: { pattern: "^(0|[1-9][0-9]*)$" },
								message: "must match pattern \"^(0|[1-9][0-9]*)$\""
							}];
							return false;
						}
					} else {
						validate236.errors = [{
							instancePath: instancePath + "/revision",
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
					if (data.theme !== void 0) {
						let data2 = data.theme;
						if (typeof data2 !== "string") {
							validate236.errors = [{
								instancePath: instancePath + "/theme",
								schemaPath: "#/$defs/Theme/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						if (!(data2 === "system" || data2 === "light" || data2 === "dark")) {
							validate236.errors = [{
								instancePath: instancePath + "/theme",
								schemaPath: "#/$defs/Theme/enum",
								keyword: "enum",
								params: { allowedValues: schema309.enum },
								message: "must be equal to one of the allowed values"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
				}
			}
		}
	} else {
		validate236.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate236.errors = vErrors;
	return true;
}
validate236.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
var schema310 = {
	"additionalProperties": false,
	"properties": {
		"avatar_id": {
			"default": null,
			"type": ["string", "null"]
		},
		"display_name": { "type": "string" },
		"id": { "type": "string" },
		"is_builtin": { "type": "boolean" },
		"kind": { "$ref": "#/$defs/ParticipantKind" },
		"profile_revision": {
			"$ref": "#/$defs/DecimalString",
			"default": "1"
		},
		"runtime": { "anyOf": [{ "$ref": "#/$defs/AgentRuntimeState" }, { "type": "null" }] },
		"status": { "$ref": "#/$defs/ParticipantStatus" }
	},
	"required": [
		"id",
		"kind",
		"display_name",
		"status",
		"is_builtin",
		"avatar_id",
		"profile_revision"
	],
	"type": "object"
};
var schema311 = {
	"enum": ["user", "agent"],
	"type": "string"
};
var schema316 = {
	"enum": ["present", "needs_configuration"],
	"type": "string"
};
var schema313 = {
	"additionalProperties": false,
	"properties": {
		"agent_id": { "type": "string" },
		"config_revision": { "$ref": "#/$defs/DecimalString" },
		"detail": { "type": ["string", "null"] },
		"next_wake_at": {
			"format": "int64",
			"type": ["integer", "null"]
		},
		"requests_today": {
			"format": "uint32",
			"minimum": 0,
			"type": "integer"
		},
		"status": { "$ref": "#/$defs/AgentRuntimeStatus" }
	},
	"required": [
		"agent_id",
		"config_revision",
		"status",
		"detail",
		"next_wake_at",
		"requests_today"
	],
	"type": "object"
};
var schema315 = {
	"enum": [
		"needs_configuration",
		"observing",
		"deciding",
		"waiting_to_send",
		"sleeping",
		"paused",
		"protected",
		"offline"
	],
	"type": "string"
};
function validate240(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate240.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.agent_id === void 0 && (missing0 = "agent_id") || data.config_revision === void 0 && (missing0 = "config_revision") || data.status === void 0 && (missing0 = "status") || data.detail === void 0 && (missing0 = "detail") || data.next_wake_at === void 0 && (missing0 = "next_wake_at") || data.requests_today === void 0 && (missing0 = "requests_today")) {
			validate240.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "agent_id" || key0 === "config_revision" || key0 === "detail" || key0 === "next_wake_at" || key0 === "requests_today" || key0 === "status")) {
				validate240.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.agent_id !== void 0) {
				if (typeof data.agent_id !== "string") {
					validate240.errors = [{
						instancePath: instancePath + "/agent_id",
						schemaPath: "#/properties/agent_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.config_revision !== void 0) {
					let data1 = data.config_revision;
					if (typeof data1 === "string") {
						if (func2(data1) > 19) {
							validate240.errors = [{
								instancePath: instancePath + "/config_revision",
								schemaPath: "#/$defs/DecimalString/maxLength",
								keyword: "maxLength",
								params: { limit: 19 },
								message: "must NOT have more than 19 characters"
							}];
							return false;
						} else if (!pattern4.test(data1)) {
							validate240.errors = [{
								instancePath: instancePath + "/config_revision",
								schemaPath: "#/$defs/DecimalString/pattern",
								keyword: "pattern",
								params: { pattern: "^(0|[1-9][0-9]*)$" },
								message: "must match pattern \"^(0|[1-9][0-9]*)$\""
							}];
							return false;
						}
					} else {
						validate240.errors = [{
							instancePath: instancePath + "/config_revision",
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
					if (data.detail !== void 0) {
						let data2 = data.detail;
						if (typeof data2 !== "string" && data2 !== null) {
							validate240.errors = [{
								instancePath: instancePath + "/detail",
								schemaPath: "#/properties/detail/type",
								keyword: "type",
								params: { type: schema313.properties.detail.type },
								message: "must be string,null"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.next_wake_at !== void 0) {
							let data3 = data.next_wake_at;
							if (!(typeof data3 == "number" && !(data3 % 1) && !isNaN(data3) && isFinite(data3)) && data3 !== null) {
								validate240.errors = [{
									instancePath: instancePath + "/next_wake_at",
									schemaPath: "#/properties/next_wake_at/type",
									keyword: "type",
									params: { type: schema313.properties.next_wake_at.type },
									message: "must be integer,null"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.requests_today !== void 0) {
								let data4 = data.requests_today;
								if (!(typeof data4 == "number" && !(data4 % 1) && !isNaN(data4) && isFinite(data4))) {
									validate240.errors = [{
										instancePath: instancePath + "/requests_today",
										schemaPath: "#/properties/requests_today/type",
										keyword: "type",
										params: { type: "integer" },
										message: "must be integer"
									}];
									return false;
								}
								if (typeof data4 == "number" && isFinite(data4)) {
									if (data4 < 0 || isNaN(data4)) {
										validate240.errors = [{
											instancePath: instancePath + "/requests_today",
											schemaPath: "#/properties/requests_today/minimum",
											keyword: "minimum",
											params: {
												comparison: ">=",
												limit: 0
											},
											message: "must be >= 0"
										}];
										return false;
									}
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.status !== void 0) {
									let data5 = data.status;
									if (typeof data5 !== "string") {
										validate240.errors = [{
											instancePath: instancePath + "/status",
											schemaPath: "#/$defs/AgentRuntimeStatus/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									if (!(data5 === "needs_configuration" || data5 === "observing" || data5 === "deciding" || data5 === "waiting_to_send" || data5 === "sleeping" || data5 === "paused" || data5 === "protected" || data5 === "offline")) {
										validate240.errors = [{
											instancePath: instancePath + "/status",
											schemaPath: "#/$defs/AgentRuntimeStatus/enum",
											keyword: "enum",
											params: { allowedValues: schema315.enum },
											message: "must be equal to one of the allowed values"
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
		validate240.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate240.errors = vErrors;
	return true;
}
validate240.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate239(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate239.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.id === void 0 && (missing0 = "id") || data.kind === void 0 && (missing0 = "kind") || data.display_name === void 0 && (missing0 = "display_name") || data.status === void 0 && (missing0 = "status") || data.is_builtin === void 0 && (missing0 = "is_builtin") || data.avatar_id === void 0 && (missing0 = "avatar_id") || data.profile_revision === void 0 && (missing0 = "profile_revision")) {
				validate239.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "avatar_id" || key0 === "display_name" || key0 === "id" || key0 === "is_builtin" || key0 === "kind" || key0 === "profile_revision" || key0 === "runtime" || key0 === "status")) {
					validate239.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.avatar_id !== void 0) {
						let data0 = data.avatar_id;
						const _errs2 = errors;
						if (typeof data0 !== "string" && data0 !== null) {
							validate239.errors = [{
								instancePath: instancePath + "/avatar_id",
								schemaPath: "#/properties/avatar_id/type",
								keyword: "type",
								params: { type: schema310.properties.avatar_id.type },
								message: "must be string,null"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.display_name !== void 0) {
							const _errs4 = errors;
							if (typeof data.display_name !== "string") {
								validate239.errors = [{
									instancePath: instancePath + "/display_name",
									schemaPath: "#/properties/display_name/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.id !== void 0) {
								const _errs6 = errors;
								if (typeof data.id !== "string") {
									validate239.errors = [{
										instancePath: instancePath + "/id",
										schemaPath: "#/properties/id/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.is_builtin !== void 0) {
									const _errs8 = errors;
									if (typeof data.is_builtin !== "boolean") {
										validate239.errors = [{
											instancePath: instancePath + "/is_builtin",
											schemaPath: "#/properties/is_builtin/type",
											keyword: "type",
											params: { type: "boolean" },
											message: "must be boolean"
										}];
										return false;
									}
									var valid0 = _errs8 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.kind !== void 0) {
										let data4 = data.kind;
										const _errs10 = errors;
										if (typeof data4 !== "string") {
											validate239.errors = [{
												instancePath: instancePath + "/kind",
												schemaPath: "#/$defs/ParticipantKind/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											}];
											return false;
										}
										if (!(data4 === "user" || data4 === "agent")) {
											validate239.errors = [{
												instancePath: instancePath + "/kind",
												schemaPath: "#/$defs/ParticipantKind/enum",
												keyword: "enum",
												params: { allowedValues: schema311.enum },
												message: "must be equal to one of the allowed values"
											}];
											return false;
										}
										var valid0 = _errs10 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.profile_revision !== void 0) {
											let data5 = data.profile_revision;
											const _errs13 = errors;
											if (errors === errors) {
												if (typeof data5 === "string") {
													if (func2(data5) > 19) {
														validate239.errors = [{
															instancePath: instancePath + "/profile_revision",
															schemaPath: "#/$defs/DecimalString/maxLength",
															keyword: "maxLength",
															params: { limit: 19 },
															message: "must NOT have more than 19 characters"
														}];
														return false;
													} else if (!pattern4.test(data5)) {
														validate239.errors = [{
															instancePath: instancePath + "/profile_revision",
															schemaPath: "#/$defs/DecimalString/pattern",
															keyword: "pattern",
															params: { pattern: "^(0|[1-9][0-9]*)$" },
															message: "must match pattern \"^(0|[1-9][0-9]*)$\""
														}];
														return false;
													}
												} else {
													validate239.errors = [{
														instancePath: instancePath + "/profile_revision",
														schemaPath: "#/$defs/DecimalString/type",
														keyword: "type",
														params: { type: "string" },
														message: "must be string"
													}];
													return false;
												}
											}
											var valid0 = _errs13 === errors;
										} else var valid0 = true;
										if (valid0) {
											if (data.runtime !== void 0) {
												let data6 = data.runtime;
												const _errs16 = errors;
												const _errs17 = errors;
												let valid3 = false;
												const _errs18 = errors;
												if (!validate240(data6, {
													instancePath: instancePath + "/runtime",
													parentData: data,
													parentDataProperty: "runtime",
													rootData,
													dynamicAnchors
												})) {
													vErrors = vErrors === null ? validate240.errors : vErrors.concat(validate240.errors);
													errors = vErrors.length;
												}
												var _valid0 = _errs18 === errors;
												valid3 = valid3 || _valid0;
												const _errs19 = errors;
												if (data6 !== null) {
													const err0 = {
														instancePath: instancePath + "/runtime",
														schemaPath: "#/properties/runtime/anyOf/1/type",
														keyword: "type",
														params: { type: "null" },
														message: "must be null"
													};
													if (vErrors === null) vErrors = [err0];
													else vErrors.push(err0);
													errors++;
												}
												var _valid0 = _errs19 === errors;
												valid3 = valid3 || _valid0;
												if (!valid3) {
													const err1 = {
														instancePath: instancePath + "/runtime",
														schemaPath: "#/properties/runtime/anyOf",
														keyword: "anyOf",
														params: {},
														message: "must match a schema in anyOf"
													};
													if (vErrors === null) vErrors = [err1];
													else vErrors.push(err1);
													errors++;
													validate239.errors = vErrors;
													return false;
												} else {
													errors = _errs17;
													if (vErrors !== null) {
														if (_errs17) vErrors.length = _errs17;
														else vErrors = null;
													}
												}
												var valid0 = _errs16 === errors;
											} else var valid0 = true;
											if (valid0) {
												if (data.status !== void 0) {
													let data7 = data.status;
													const _errs21 = errors;
													if (typeof data7 !== "string") {
														validate239.errors = [{
															instancePath: instancePath + "/status",
															schemaPath: "#/$defs/ParticipantStatus/type",
															keyword: "type",
															params: { type: "string" },
															message: "must be string"
														}];
														return false;
													}
													if (!(data7 === "present" || data7 === "needs_configuration")) {
														validate239.errors = [{
															instancePath: instancePath + "/status",
															schemaPath: "#/$defs/ParticipantStatus/enum",
															keyword: "enum",
															params: { allowedValues: schema316.enum },
															message: "must be equal to one of the allowed values"
														}];
														return false;
													}
													var valid0 = _errs21 === errors;
												} else var valid0 = true;
											}
										}
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate239.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate239.errors = vErrors;
	return errors === 0;
}
validate239.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate233(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate233.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	let passing0 = null;
	const _errs1 = errors;
	if (errors === _errs1) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.kind === void 0 && (missing0 = "kind") || data.message_id === void 0 && (missing0 = "message_id") || data.message_seq === void 0 && (missing0 = "message_seq") || data.sender_id === void 0 && (missing0 = "sender_id")) {
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
				for (const key0 in data) if (!(key0 === "kind" || key0 === "message_id" || key0 === "message_seq" || key0 === "sender_id")) {
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
						if ("message_committed" !== data0) {
							const err3 = {
								instancePath: instancePath + "/kind",
								schemaPath: "#/oneOf/0/properties/kind/const",
								keyword: "const",
								params: { allowedValue: "message_committed" },
								message: "must be equal to constant"
							};
							if (vErrors === null) vErrors = [err3];
							else vErrors.push(err3);
							errors++;
						}
						var valid1 = _errs4 === errors;
					} else var valid1 = true;
					if (valid1) {
						if (data.message_id !== void 0) {
							const _errs6 = errors;
							if (typeof data.message_id !== "string") {
								const err4 = {
									instancePath: instancePath + "/message_id",
									schemaPath: "#/oneOf/0/properties/message_id/type",
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
						if (valid1) {
							if (data.message_seq !== void 0) {
								let data2 = data.message_seq;
								const _errs8 = errors;
								if (errors === errors) {
									if (typeof data2 === "string") {
										if (func2(data2) > 19) {
											const err5 = {
												instancePath: instancePath + "/message_seq",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											};
											if (vErrors === null) vErrors = [err5];
											else vErrors.push(err5);
											errors++;
										} else if (!pattern4.test(data2)) {
											const err6 = {
												instancePath: instancePath + "/message_seq",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											};
											if (vErrors === null) vErrors = [err6];
											else vErrors.push(err6);
											errors++;
										}
									} else {
										const err7 = {
											instancePath: instancePath + "/message_seq",
											schemaPath: "#/$defs/DecimalString/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										};
										if (vErrors === null) vErrors = [err7];
										else vErrors.push(err7);
										errors++;
									}
								}
								var valid1 = _errs8 === errors;
							} else var valid1 = true;
							if (valid1) {
								if (data.sender_id !== void 0) {
									const _errs11 = errors;
									if (typeof data.sender_id !== "string") {
										const err8 = {
											instancePath: instancePath + "/sender_id",
											schemaPath: "#/oneOf/0/properties/sender_id/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										};
										if (vErrors === null) vErrors = [err8];
										else vErrors.push(err8);
										errors++;
									}
									var valid1 = _errs11 === errors;
								} else var valid1 = true;
							}
						}
					}
				}
			}
		} else {
			const err9 = {
				instancePath,
				schemaPath: "#/oneOf/0/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			};
			if (vErrors === null) vErrors = [err9];
			else vErrors.push(err9);
			errors++;
		}
	}
	var _valid0 = _errs1 === errors;
	if (_valid0) {
		valid0 = true;
		passing0 = 0;
		var props0 = true;
	}
	const _errs13 = errors;
	if (errors === _errs13) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing1;
			if (data.kind === void 0 && (missing1 = "kind") || data.message_id === void 0 && (missing1 = "message_id") || data.message_seq === void 0 && (missing1 = "message_seq") || data.room === void 0 && (missing1 = "room")) {
				const err10 = {
					instancePath,
					schemaPath: "#/oneOf/1/required",
					keyword: "required",
					params: { missingProperty: missing1 },
					message: "must have required property '" + missing1 + "'"
				};
				if (vErrors === null) vErrors = [err10];
				else vErrors.push(err10);
				errors++;
			} else {
				const _errs15 = errors;
				for (const key1 in data) if (!(key1 === "kind" || key1 === "message_id" || key1 === "message_seq" || key1 === "room")) {
					const err11 = {
						instancePath,
						schemaPath: "#/oneOf/1/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key1 },
						message: "must NOT have additional properties"
					};
					if (vErrors === null) vErrors = [err11];
					else vErrors.push(err11);
					errors++;
					break;
				}
				if (_errs15 === errors) {
					if (data.kind !== void 0) {
						let data4 = data.kind;
						const _errs16 = errors;
						if (typeof data4 !== "string") {
							const err12 = {
								instancePath: instancePath + "/kind",
								schemaPath: "#/oneOf/1/properties/kind/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							};
							if (vErrors === null) vErrors = [err12];
							else vErrors.push(err12);
							errors++;
						}
						if ("message_changed" !== data4) {
							const err13 = {
								instancePath: instancePath + "/kind",
								schemaPath: "#/oneOf/1/properties/kind/const",
								keyword: "const",
								params: { allowedValue: "message_changed" },
								message: "must be equal to constant"
							};
							if (vErrors === null) vErrors = [err13];
							else vErrors.push(err13);
							errors++;
						}
						var valid3 = _errs16 === errors;
					} else var valid3 = true;
					if (valid3) {
						if (data.message_id !== void 0) {
							const _errs18 = errors;
							if (typeof data.message_id !== "string") {
								const err14 = {
									instancePath: instancePath + "/message_id",
									schemaPath: "#/oneOf/1/properties/message_id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								};
								if (vErrors === null) vErrors = [err14];
								else vErrors.push(err14);
								errors++;
							}
							var valid3 = _errs18 === errors;
						} else var valid3 = true;
						if (valid3) {
							if (data.message_seq !== void 0) {
								let data6 = data.message_seq;
								const _errs20 = errors;
								if (errors === errors) {
									if (typeof data6 === "string") {
										if (func2(data6) > 19) {
											const err15 = {
												instancePath: instancePath + "/message_seq",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											};
											if (vErrors === null) vErrors = [err15];
											else vErrors.push(err15);
											errors++;
										} else if (!pattern4.test(data6)) {
											const err16 = {
												instancePath: instancePath + "/message_seq",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											};
											if (vErrors === null) vErrors = [err16];
											else vErrors.push(err16);
											errors++;
										}
									} else {
										const err17 = {
											instancePath: instancePath + "/message_seq",
											schemaPath: "#/$defs/DecimalString/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										};
										if (vErrors === null) vErrors = [err17];
										else vErrors.push(err17);
										errors++;
									}
								}
								var valid3 = _errs20 === errors;
							} else var valid3 = true;
							if (valid3) {
								if (data.room !== void 0) {
									const _errs23 = errors;
									if (!validate234(data.room, {
										instancePath: instancePath + "/room",
										parentData: data,
										parentDataProperty: "room",
										rootData,
										dynamicAnchors
									})) {
										vErrors = vErrors === null ? validate234.errors : vErrors.concat(validate234.errors);
										errors = vErrors.length;
									}
									var valid3 = _errs23 === errors;
								} else var valid3 = true;
							}
						}
					}
				}
			}
		} else {
			const err18 = {
				instancePath,
				schemaPath: "#/oneOf/1/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			};
			if (vErrors === null) vErrors = [err18];
			else vErrors.push(err18);
			errors++;
		}
	}
	var _valid0 = _errs13 === errors;
	if (_valid0 && valid0) {
		valid0 = false;
		passing0 = [passing0, 1];
	} else {
		if (_valid0) {
			valid0 = true;
			passing0 = 1;
			if (props0 !== true) props0 = true;
		}
		const _errs24 = errors;
		if (errors === _errs24) {
			if (data && typeof data == "object" && !Array.isArray(data)) {
				let missing2;
				if (data.kind === void 0 && (missing2 = "kind") || data.appearance === void 0 && (missing2 = "appearance")) {
					const err19 = {
						instancePath,
						schemaPath: "#/oneOf/2/required",
						keyword: "required",
						params: { missingProperty: missing2 },
						message: "must have required property '" + missing2 + "'"
					};
					if (vErrors === null) vErrors = [err19];
					else vErrors.push(err19);
					errors++;
				} else {
					const _errs26 = errors;
					for (const key2 in data) if (!(key2 === "appearance" || key2 === "kind")) {
						const err20 = {
							instancePath,
							schemaPath: "#/oneOf/2/additionalProperties",
							keyword: "additionalProperties",
							params: { additionalProperty: key2 },
							message: "must NOT have additional properties"
						};
						if (vErrors === null) vErrors = [err20];
						else vErrors.push(err20);
						errors++;
						break;
					}
					if (_errs26 === errors) {
						if (data.appearance !== void 0) {
							const _errs27 = errors;
							if (!validate236(data.appearance, {
								instancePath: instancePath + "/appearance",
								parentData: data,
								parentDataProperty: "appearance",
								rootData,
								dynamicAnchors
							})) {
								vErrors = vErrors === null ? validate236.errors : vErrors.concat(validate236.errors);
								errors = vErrors.length;
							}
							var valid5 = _errs27 === errors;
						} else var valid5 = true;
						if (valid5) {
							if (data.kind !== void 0) {
								let data9 = data.kind;
								const _errs28 = errors;
								if (typeof data9 !== "string") {
									const err21 = {
										instancePath: instancePath + "/kind",
										schemaPath: "#/oneOf/2/properties/kind/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									};
									if (vErrors === null) vErrors = [err21];
									else vErrors.push(err21);
									errors++;
								}
								if ("appearance_changed" !== data9) {
									const err22 = {
										instancePath: instancePath + "/kind",
										schemaPath: "#/oneOf/2/properties/kind/const",
										keyword: "const",
										params: { allowedValue: "appearance_changed" },
										message: "must be equal to constant"
									};
									if (vErrors === null) vErrors = [err22];
									else vErrors.push(err22);
									errors++;
								}
								var valid5 = _errs28 === errors;
							} else var valid5 = true;
						}
					}
				}
			} else {
				const err23 = {
					instancePath,
					schemaPath: "#/oneOf/2/type",
					keyword: "type",
					params: { type: "object" },
					message: "must be object"
				};
				if (vErrors === null) vErrors = [err23];
				else vErrors.push(err23);
				errors++;
			}
		}
		var _valid0 = _errs24 === errors;
		if (_valid0 && valid0) {
			valid0 = false;
			passing0 = [passing0, 2];
		} else {
			if (_valid0) {
				valid0 = true;
				passing0 = 2;
				if (props0 !== true) props0 = true;
			}
			const _errs30 = errors;
			if (errors === _errs30) {
				if (data && typeof data == "object" && !Array.isArray(data)) {
					let missing3;
					if (data.kind === void 0 && (missing3 = "kind") || data.room === void 0 && (missing3 = "room")) {
						const err24 = {
							instancePath,
							schemaPath: "#/oneOf/3/required",
							keyword: "required",
							params: { missingProperty: missing3 },
							message: "must have required property '" + missing3 + "'"
						};
						if (vErrors === null) vErrors = [err24];
						else vErrors.push(err24);
						errors++;
					} else {
						const _errs32 = errors;
						for (const key3 in data) if (!(key3 === "kind" || key3 === "room")) {
							const err25 = {
								instancePath,
								schemaPath: "#/oneOf/3/additionalProperties",
								keyword: "additionalProperties",
								params: { additionalProperty: key3 },
								message: "must NOT have additional properties"
							};
							if (vErrors === null) vErrors = [err25];
							else vErrors.push(err25);
							errors++;
							break;
						}
						if (_errs32 === errors) {
							if (data.kind !== void 0) {
								let data10 = data.kind;
								const _errs33 = errors;
								if (typeof data10 !== "string") {
									const err26 = {
										instancePath: instancePath + "/kind",
										schemaPath: "#/oneOf/3/properties/kind/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									};
									if (vErrors === null) vErrors = [err26];
									else vErrors.push(err26);
									errors++;
								}
								if ("room_changed" !== data10) {
									const err27 = {
										instancePath: instancePath + "/kind",
										schemaPath: "#/oneOf/3/properties/kind/const",
										keyword: "const",
										params: { allowedValue: "room_changed" },
										message: "must be equal to constant"
									};
									if (vErrors === null) vErrors = [err27];
									else vErrors.push(err27);
									errors++;
								}
								var valid6 = _errs33 === errors;
							} else var valid6 = true;
							if (valid6) {
								if (data.room !== void 0) {
									const _errs35 = errors;
									if (!validate234(data.room, {
										instancePath: instancePath + "/room",
										parentData: data,
										parentDataProperty: "room",
										rootData,
										dynamicAnchors
									})) {
										vErrors = vErrors === null ? validate234.errors : vErrors.concat(validate234.errors);
										errors = vErrors.length;
									}
									var valid6 = _errs35 === errors;
								} else var valid6 = true;
							}
						}
					}
				} else {
					const err28 = {
						instancePath,
						schemaPath: "#/oneOf/3/type",
						keyword: "type",
						params: { type: "object" },
						message: "must be object"
					};
					if (vErrors === null) vErrors = [err28];
					else vErrors.push(err28);
					errors++;
				}
			}
			var _valid0 = _errs30 === errors;
			if (_valid0 && valid0) {
				valid0 = false;
				passing0 = [passing0, 3];
			} else {
				if (_valid0) {
					valid0 = true;
					passing0 = 3;
					if (props0 !== true) props0 = true;
				}
				const _errs36 = errors;
				if (errors === _errs36) {
					if (data && typeof data == "object" && !Array.isArray(data)) {
						let missing4;
						if (data.kind === void 0 && (missing4 = "kind") || data.participant === void 0 && (missing4 = "participant")) {
							const err29 = {
								instancePath,
								schemaPath: "#/oneOf/4/required",
								keyword: "required",
								params: { missingProperty: missing4 },
								message: "must have required property '" + missing4 + "'"
							};
							if (vErrors === null) vErrors = [err29];
							else vErrors.push(err29);
							errors++;
						} else {
							const _errs38 = errors;
							for (const key4 in data) if (!(key4 === "kind" || key4 === "participant")) {
								const err30 = {
									instancePath,
									schemaPath: "#/oneOf/4/additionalProperties",
									keyword: "additionalProperties",
									params: { additionalProperty: key4 },
									message: "must NOT have additional properties"
								};
								if (vErrors === null) vErrors = [err30];
								else vErrors.push(err30);
								errors++;
								break;
							}
							if (_errs38 === errors) {
								if (data.kind !== void 0) {
									let data12 = data.kind;
									const _errs39 = errors;
									if (typeof data12 !== "string") {
										const err31 = {
											instancePath: instancePath + "/kind",
											schemaPath: "#/oneOf/4/properties/kind/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										};
										if (vErrors === null) vErrors = [err31];
										else vErrors.push(err31);
										errors++;
									}
									if ("participant_profile_changed" !== data12) {
										const err32 = {
											instancePath: instancePath + "/kind",
											schemaPath: "#/oneOf/4/properties/kind/const",
											keyword: "const",
											params: { allowedValue: "participant_profile_changed" },
											message: "must be equal to constant"
										};
										if (vErrors === null) vErrors = [err32];
										else vErrors.push(err32);
										errors++;
									}
									var valid7 = _errs39 === errors;
								} else var valid7 = true;
								if (valid7) {
									if (data.participant !== void 0) {
										const _errs41 = errors;
										if (!validate239(data.participant, {
											instancePath: instancePath + "/participant",
											parentData: data,
											parentDataProperty: "participant",
											rootData,
											dynamicAnchors
										})) {
											vErrors = vErrors === null ? validate239.errors : vErrors.concat(validate239.errors);
											errors = vErrors.length;
										}
										var valid7 = _errs41 === errors;
									} else var valid7 = true;
								}
							}
						}
					} else {
						const err33 = {
							instancePath,
							schemaPath: "#/oneOf/4/type",
							keyword: "type",
							params: { type: "object" },
							message: "must be object"
						};
						if (vErrors === null) vErrors = [err33];
						else vErrors.push(err33);
						errors++;
					}
				}
				var _valid0 = _errs36 === errors;
				if (_valid0 && valid0) {
					valid0 = false;
					passing0 = [passing0, 4];
				} else {
					if (_valid0) {
						valid0 = true;
						passing0 = 4;
						if (props0 !== true) props0 = true;
					}
					const _errs42 = errors;
					if (errors === _errs42) {
						if (data && typeof data == "object" && !Array.isArray(data)) {
							let missing5;
							if (data.kind === void 0 && (missing5 = "kind") || data.agent_id === void 0 && (missing5 = "agent_id") || data.revision === void 0 && (missing5 = "revision")) {
								const err34 = {
									instancePath,
									schemaPath: "#/oneOf/5/required",
									keyword: "required",
									params: { missingProperty: missing5 },
									message: "must have required property '" + missing5 + "'"
								};
								if (vErrors === null) vErrors = [err34];
								else vErrors.push(err34);
								errors++;
							} else {
								const _errs44 = errors;
								for (const key5 in data) if (!(key5 === "agent_id" || key5 === "kind" || key5 === "revision")) {
									const err35 = {
										instancePath,
										schemaPath: "#/oneOf/5/additionalProperties",
										keyword: "additionalProperties",
										params: { additionalProperty: key5 },
										message: "must NOT have additional properties"
									};
									if (vErrors === null) vErrors = [err35];
									else vErrors.push(err35);
									errors++;
									break;
								}
								if (_errs44 === errors) {
									if (data.agent_id !== void 0) {
										const _errs45 = errors;
										if (typeof data.agent_id !== "string") {
											const err36 = {
												instancePath: instancePath + "/agent_id",
												schemaPath: "#/oneOf/5/properties/agent_id/type",
												keyword: "type",
												params: { type: "string" },
												message: "must be string"
											};
											if (vErrors === null) vErrors = [err36];
											else vErrors.push(err36);
											errors++;
										}
										var valid8 = _errs45 === errors;
									} else var valid8 = true;
									if (valid8) {
										if (data.kind !== void 0) {
											let data15 = data.kind;
											const _errs47 = errors;
											if (typeof data15 !== "string") {
												const err37 = {
													instancePath: instancePath + "/kind",
													schemaPath: "#/oneOf/5/properties/kind/type",
													keyword: "type",
													params: { type: "string" },
													message: "must be string"
												};
												if (vErrors === null) vErrors = [err37];
												else vErrors.push(err37);
												errors++;
											}
											if ("agent_configuration_changed" !== data15) {
												const err38 = {
													instancePath: instancePath + "/kind",
													schemaPath: "#/oneOf/5/properties/kind/const",
													keyword: "const",
													params: { allowedValue: "agent_configuration_changed" },
													message: "must be equal to constant"
												};
												if (vErrors === null) vErrors = [err38];
												else vErrors.push(err38);
												errors++;
											}
											var valid8 = _errs47 === errors;
										} else var valid8 = true;
										if (valid8) {
											if (data.revision !== void 0) {
												let data16 = data.revision;
												const _errs49 = errors;
												if (errors === errors) {
													if (typeof data16 === "string") {
														if (func2(data16) > 19) {
															const err39 = {
																instancePath: instancePath + "/revision",
																schemaPath: "#/$defs/DecimalString/maxLength",
																keyword: "maxLength",
																params: { limit: 19 },
																message: "must NOT have more than 19 characters"
															};
															if (vErrors === null) vErrors = [err39];
															else vErrors.push(err39);
															errors++;
														} else if (!pattern4.test(data16)) {
															const err40 = {
																instancePath: instancePath + "/revision",
																schemaPath: "#/$defs/DecimalString/pattern",
																keyword: "pattern",
																params: { pattern: "^(0|[1-9][0-9]*)$" },
																message: "must match pattern \"^(0|[1-9][0-9]*)$\""
															};
															if (vErrors === null) vErrors = [err40];
															else vErrors.push(err40);
															errors++;
														}
													} else {
														const err41 = {
															instancePath: instancePath + "/revision",
															schemaPath: "#/$defs/DecimalString/type",
															keyword: "type",
															params: { type: "string" },
															message: "must be string"
														};
														if (vErrors === null) vErrors = [err41];
														else vErrors.push(err41);
														errors++;
													}
												}
												var valid8 = _errs49 === errors;
											} else var valid8 = true;
										}
									}
								}
							}
						} else {
							const err42 = {
								instancePath,
								schemaPath: "#/oneOf/5/type",
								keyword: "type",
								params: { type: "object" },
								message: "must be object"
							};
							if (vErrors === null) vErrors = [err42];
							else vErrors.push(err42);
							errors++;
						}
					}
					var _valid0 = _errs42 === errors;
					if (_valid0 && valid0) {
						valid0 = false;
						passing0 = [passing0, 5];
					} else {
						if (_valid0) {
							valid0 = true;
							passing0 = 5;
							if (props0 !== true) props0 = true;
						}
						const _errs52 = errors;
						if (errors === _errs52) {
							if (data && typeof data == "object" && !Array.isArray(data)) {
								let missing6;
								if (data.kind === void 0 && (missing6 = "kind") || data.revision === void 0 && (missing6 = "revision")) {
									const err43 = {
										instancePath,
										schemaPath: "#/oneOf/6/required",
										keyword: "required",
										params: { missingProperty: missing6 },
										message: "must have required property '" + missing6 + "'"
									};
									if (vErrors === null) vErrors = [err43];
									else vErrors.push(err43);
									errors++;
								} else {
									const _errs54 = errors;
									for (const key6 in data) if (!(key6 === "kind" || key6 === "revision")) {
										const err44 = {
											instancePath,
											schemaPath: "#/oneOf/6/additionalProperties",
											keyword: "additionalProperties",
											params: { additionalProperty: key6 },
											message: "must NOT have additional properties"
										};
										if (vErrors === null) vErrors = [err44];
										else vErrors.push(err44);
										errors++;
										break;
									}
									if (_errs54 === errors) {
										if (data.kind !== void 0) {
											let data17 = data.kind;
											const _errs55 = errors;
											if (typeof data17 !== "string") {
												const err45 = {
													instancePath: instancePath + "/kind",
													schemaPath: "#/oneOf/6/properties/kind/type",
													keyword: "type",
													params: { type: "string" },
													message: "must be string"
												};
												if (vErrors === null) vErrors = [err45];
												else vErrors.push(err45);
												errors++;
											}
											if ("global_configuration_changed" !== data17) {
												const err46 = {
													instancePath: instancePath + "/kind",
													schemaPath: "#/oneOf/6/properties/kind/const",
													keyword: "const",
													params: { allowedValue: "global_configuration_changed" },
													message: "must be equal to constant"
												};
												if (vErrors === null) vErrors = [err46];
												else vErrors.push(err46);
												errors++;
											}
											var valid10 = _errs55 === errors;
										} else var valid10 = true;
										if (valid10) {
											if (data.revision !== void 0) {
												let data18 = data.revision;
												const _errs57 = errors;
												if (errors === errors) {
													if (typeof data18 === "string") {
														if (func2(data18) > 19) {
															const err47 = {
																instancePath: instancePath + "/revision",
																schemaPath: "#/$defs/DecimalString/maxLength",
																keyword: "maxLength",
																params: { limit: 19 },
																message: "must NOT have more than 19 characters"
															};
															if (vErrors === null) vErrors = [err47];
															else vErrors.push(err47);
															errors++;
														} else if (!pattern4.test(data18)) {
															const err48 = {
																instancePath: instancePath + "/revision",
																schemaPath: "#/$defs/DecimalString/pattern",
																keyword: "pattern",
																params: { pattern: "^(0|[1-9][0-9]*)$" },
																message: "must match pattern \"^(0|[1-9][0-9]*)$\""
															};
															if (vErrors === null) vErrors = [err48];
															else vErrors.push(err48);
															errors++;
														}
													} else {
														const err49 = {
															instancePath: instancePath + "/revision",
															schemaPath: "#/$defs/DecimalString/type",
															keyword: "type",
															params: { type: "string" },
															message: "must be string"
														};
														if (vErrors === null) vErrors = [err49];
														else vErrors.push(err49);
														errors++;
													}
												}
												var valid10 = _errs57 === errors;
											} else var valid10 = true;
										}
									}
								}
							} else {
								const err50 = {
									instancePath,
									schemaPath: "#/oneOf/6/type",
									keyword: "type",
									params: { type: "object" },
									message: "must be object"
								};
								if (vErrors === null) vErrors = [err50];
								else vErrors.push(err50);
								errors++;
							}
						}
						var _valid0 = _errs52 === errors;
						if (_valid0 && valid0) {
							valid0 = false;
							passing0 = [passing0, 6];
						} else if (_valid0) {
							valid0 = true;
							passing0 = 6;
							if (props0 !== true) props0 = true;
						}
					}
				}
			}
		}
	}
	if (!valid0) {
		const err51 = {
			instancePath,
			schemaPath: "#/oneOf",
			keyword: "oneOf",
			params: { passingSchemas: passing0 },
			message: "must match exactly one schema in oneOf"
		};
		if (vErrors === null) vErrors = [err51];
		else vErrors.push(err51);
		errors++;
		validate233.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate233.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate233.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
function validate232(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate232.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.schema_version === void 0 && (missing0 = "schema_version") || data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.event_seq === void 0 && (missing0 = "event_seq") || data.event_id === void 0 && (missing0 = "event_id") || data.occurred_at === void 0 && (missing0 = "occurred_at") || data.payload === void 0 && (missing0 = "payload")) {
				validate232.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "event_id" || key0 === "event_seq" || key0 === "occurred_at" || key0 === "payload" || key0 === "schema_version")) {
					validate232.errors = [{
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
							validate232.errors = [{
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
						if (data.event_id !== void 0) {
							const _errs4 = errors;
							if (typeof data.event_id !== "string") {
								validate232.errors = [{
									instancePath: instancePath + "/event_id",
									schemaPath: "#/properties/event_id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.event_seq !== void 0) {
								let data2 = data.event_seq;
								const _errs6 = errors;
								if (errors === errors) {
									if (typeof data2 === "string") {
										if (func2(data2) > 19) {
											validate232.errors = [{
												instancePath: instancePath + "/event_seq",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											}];
											return false;
										} else if (!pattern4.test(data2)) {
											validate232.errors = [{
												instancePath: instancePath + "/event_seq",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											}];
											return false;
										}
									} else {
										validate232.errors = [{
											instancePath: instancePath + "/event_seq",
											schemaPath: "#/$defs/DecimalString/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.occurred_at !== void 0) {
									let data3 = data.occurred_at;
									const _errs9 = errors;
									if (!(typeof data3 == "number" && !(data3 % 1) && !isNaN(data3) && isFinite(data3))) {
										validate232.errors = [{
											instancePath: instancePath + "/occurred_at",
											schemaPath: "#/properties/occurred_at/type",
											keyword: "type",
											params: { type: "integer" },
											message: "must be integer"
										}];
										return false;
									}
									if (errors === _errs9) {
										if (typeof data3 == "number" && isFinite(data3)) {
											if (data3 > 9007199254740991 || isNaN(data3)) {
												validate232.errors = [{
													instancePath: instancePath + "/occurred_at",
													schemaPath: "#/properties/occurred_at/maximum",
													keyword: "maximum",
													params: {
														comparison: "<=",
														limit: 9007199254740991
													},
													message: "must be <= 9007199254740991"
												}];
												return false;
											} else if (data3 < -9007199254740991 || isNaN(data3)) {
												validate232.errors = [{
													instancePath: instancePath + "/occurred_at",
													schemaPath: "#/properties/occurred_at/minimum",
													keyword: "minimum",
													params: {
														comparison: ">=",
														limit: -9007199254740991
													},
													message: "must be >= -9007199254740991"
												}];
												return false;
											}
										}
									}
									var valid0 = _errs9 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.payload !== void 0) {
										const _errs11 = errors;
										if (!validate233(data.payload, {
											instancePath: instancePath + "/payload",
											parentData: data,
											parentDataProperty: "payload",
											rootData,
											dynamicAnchors
										})) {
											vErrors = vErrors === null ? validate233.errors : vErrors.concat(validate233.errors);
											errors = vErrors.length;
										}
										var valid0 = _errs11 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.schema_version !== void 0) {
											let data5 = data.schema_version;
											const _errs12 = errors;
											if (typeof data5 !== "string") {
												validate232.errors = [{
													instancePath: instancePath + "/schema_version",
													schemaPath: "#/$defs/SchemaVersion/type",
													keyword: "type",
													params: { type: "string" },
													message: "must be string"
												}];
												return false;
											}
											if (!(data5 === "0.3")) {
												validate232.errors = [{
													instancePath: instancePath + "/schema_version",
													schemaPath: "#/$defs/SchemaVersion/enum",
													keyword: "enum",
													params: { allowedValues: schema319.enum },
													message: "must be equal to one of the allowed values"
												}];
												return false;
											}
											var valid0 = _errs12 === errors;
										} else var valid0 = true;
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate232.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate232.errors = vErrors;
	return errors === 0;
}
validate232.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateDomainEvent };
