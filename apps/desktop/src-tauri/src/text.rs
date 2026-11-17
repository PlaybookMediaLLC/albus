//! The text of the menu bar, the update dialogs and the server picker, in the language of the
//! system. The locales are the web app's (i18n/). English fills any gap.

use std::{collections::HashMap, sync::OnceLock};

macro_rules! locales {
    ($($code:literal),* $(,)?) => {
        &[$(($code, include_str!(concat!("../locales/", $code, ".json")))),*]
    };
}

/// English first: it is the fallback for a missing key.
const LOCALES: &[(&str, &str)] = locales!(
    "en-US", "az-AZ", "de-DE", "el-GR", "es-ES", "fr-FR", "hi-IN", "id-ID", "it-IT", "ja-JP",
    "ko-KR", "mk-MK", "nl-NL", "pl-PL", "pt-BR", "ru-RU", "tr-TR", "uk-UA", "vi-VN", "zh-CN",
    "zh-TW",
);

static TEXT: OnceLock<HashMap<String, String>> = OnceLock::new();

/// The locale for a system language tag such as "de-DE", "pt_PT" or "zh-Hant-TW".
fn locale_for(tag: &str) -> &'static str {
    let tag = tag.replace('_', "-").to_ascii_lowercase();
    if let Some((code, _)) = LOCALES
        .iter()
        .find(|(code, _)| code.eq_ignore_ascii_case(&tag))
    {
        return code;
    }
    let language = tag.split('-').next().unwrap_or_default();
    if language == "zh" {
        let traditional = tag.contains("hant")
            || ["-tw", "-hk", "-mo"]
                .iter()
                .any(|region| tag.ends_with(region));
        return if traditional { "zh-TW" } else { "zh-CN" };
    }
    LOCALES
        .iter()
        .map(|(code, _)| *code)
        .find(|code| code.split('-').next() == Some(language))
        .unwrap_or("en-US")
}

fn parse(json: &str) -> HashMap<String, String> {
    serde_json::from_str(json).expect("a valid locale file")
}

fn load(code: &str) -> HashMap<String, String> {
    let mut text = parse(LOCALES[0].1);
    if let Some((_, json)) = LOCALES.iter().find(|(candidate, _)| *candidate == code) {
        text.extend(parse(json));
    }
    text
}

/// The locale of the system language.
pub fn locale() -> &'static str {
    locale_for(&sys_locale::get_locale().unwrap_or_default())
}

pub fn all() -> &'static HashMap<String, String> {
    TEXT.get_or_init(|| load(locale()))
}

pub fn t(key: &str) -> String {
    all().get(key).cloned().unwrap_or_else(|| key.to_string())
}

/// The text of `key` with `{name}` replaced by `value`.
pub fn with(key: &str, name: &str, value: &str) -> String {
    t(key).replace(&format!("{{{name}}}"), value)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_locale_has_the_english_keys_and_placeholders() {
        let english = parse(LOCALES[0].1);
        for (code, json) in LOCALES {
            let text = parse(json);
            let mut missing: Vec<_> = english
                .keys()
                .filter(|key| !text.contains_key(*key))
                .collect();
            missing.sort();
            assert!(missing.is_empty(), "{code} has no {missing:?}");
            assert_eq!(text.len(), english.len(), "{code} has extra keys");
            for (key, value) in &english {
                for placeholder in ["{version}", "{error}", "{host}"] {
                    assert_eq!(
                        value.contains(placeholder),
                        text[key].contains(placeholder),
                        "{code} {key} {placeholder}"
                    );
                }
            }
        }
    }

    #[test]
    fn picks_the_closest_locale() {
        for (tag, expected) in [
            ("de-DE", "de-DE"),
            ("de_AT", "de-DE"),
            ("pt-PT", "pt-BR"),
            ("zh-Hans-CN", "zh-CN"),
            ("zh-Hant-TW", "zh-TW"),
            ("zh-HK", "zh-TW"),
            ("en-GB", "en-US"),
            ("xx", "en-US"),
            ("", "en-US"),
        ] {
            assert_eq!(locale_for(tag), expected, "{tag}");
        }
    }

    #[test]
    fn fills_a_placeholder() {
        let text = load("en-US");
        assert_eq!(
            text["picker.noAnswer"].replace("{host}", "quills.example.com"),
            "quills.example.com does not answer."
        );
    }
}
